import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PlanNewView from '@/views/PlanNewView.vue'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))
vi.mock('@/services/attractions', () => ({
  getSidos: vi.fn(async () => [{ sidoCode: 50, sidoName: '제주특별자치도' }]),
  getGuguns: vi.fn(async () => []),
}))
vi.mock('@/services/groups', () => ({ getGroups: vi.fn(async () => []) }))

// AI 서비스 모킹(buildItinerary·상수는 실제 사용).
const createTripCandidates = vi.fn(async () => ({
  sessionId: 's1',
  reply: '제주 후보를 골라봤어요.',
  candidates: [
    { candidateId: 'c1', name: '성산일출봉' },
    { candidateId: 'c2', name: '우도' },
  ],
}))
const recommendTrip = vi.fn(async () => ({
  recommendations: [
    { contentId: 101, title: '성산일출봉', contentTypeId: 12, sidoName: '제주특별자치도', gugunName: '서귀포시', latitude: 33.4, longitude: 126.9, similarity: 0.91 },
    { contentId: 102, title: '우도', contentTypeId: 12, sidoName: '제주특별자치도', gugunName: '제주시', latitude: 33.5, longitude: 126.9, similarity: 0.86 },
  ],
}))
const recommendRestaurants = vi.fn(async () => [
  { contentId: 201, title: '제주식당1', contentTypeId: 39, sidoName: '제주특별자치도', gugunName: '제주시', latitude: 33.5, longitude: 126.5 },
  { contentId: 202, title: '제주식당2', contentTypeId: 39, sidoName: '제주특별자치도', gugunName: '제주시', latitude: 33.5, longitude: 126.5 },
  { contentId: 203, title: '제주식당3', contentTypeId: 39, sidoName: '제주특별자치도', gugunName: '제주시', latitude: 33.5, longitude: 126.5 },
])
const createTripFromItinerary = vi.fn(async () => ({ tripId: 777 }))
vi.mock('@/services/aiTrip', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual, // buildItinerary, dayList, RESTAURANT_CONTENT_TYPE_ID 는 실제.
    createTripCandidates: (...a) => createTripCandidates(...a),
    recommendTrip: (...a) => recommendTrip(...a),
    recommendRestaurants: (...a) => recommendRestaurants(...a),
    createTripFromItinerary: (...a) => createTripFromItinerary(...a),
  }
})

function mountView() {
  return mount(PlanNewView, { global: { stubs: { 'router-link': true } } })
}

async function fillForm(wrapper) {
  await wrapper.find('select').setValue(50)
  const dates = wrapper.findAll('input[type="date"]')
  await dates[0].setValue('2026-07-01')
  await dates[1].setValue('2026-07-02')
  const styleBtn = wrapper.findAll('button').find((b) => b.text().includes('자연'))
  await styleBtn.trigger('click')
}

describe('S5 AI 추천 2단계 흐름 (form → select → create)', () => {
  beforeEach(() => {
    createTripCandidates.mockClear()
    recommendTrip.mockClear()
    recommendRestaurants.mockClear()
    createTripFromItinerary.mockClear()
    push.mockClear()
  })

  it('폼 제출 시 후보 자동생성·전체선택 후 실제 추천을 선택 화면에 보여준다', async () => {
    const wrapper = mountView()
    await flushPromises()
    await fillForm(wrapper)
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('자동 생성'))
      .trigger('click')
    await flushPromises()

    expect(createTripCandidates).toHaveBeenCalledTimes(1)
    // 후보 전체(c1,c2)를 자동선택해 추천을 가져온다.
    expect(recommendTrip).toHaveBeenCalledTimes(1)
    expect(recommendTrip.mock.calls[0][0]).toMatchObject({
      sessionId: 's1',
      selectedCandidateIds: ['c1', 'c2'],
    })
    expect(wrapper.text()).toContain('어디를 둘러볼까요?')
    expect(wrapper.text()).toContain('성산일출봉')
  })

  it('추천 선택 후 여행 만들기 → 식당 추가·일정 조립·생성·이동', async () => {
    const wrapper = mountView()
    await flushPromises()
    await fillForm(wrapper)
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('자동 생성'))
      .trigger('click')
    await flushPromises()

    // 선택 전엔 생성 버튼 비활성
    const createBtnBefore = wrapper.findAll('button').find((b) => b.text().includes('여행 만들기'))
    expect(createBtnBefore.attributes('disabled')).toBeDefined()

    // 추천 1곳 선택
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('성산일출봉'))
      .trigger('click')

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('여행 만들기'))
      .trigger('click')
    await flushPromises()

    // 식당 추천(일수×3)과 여행 생성이 호출된다.
    expect(recommendRestaurants).toHaveBeenCalledTimes(1)
    expect(recommendRestaurants.mock.calls[0][0]).toMatchObject({ sessionId: 's1', days: 2 })
    expect(createTripFromItinerary).toHaveBeenCalledTimes(1)
    const arg = createTripFromItinerary.mock.calls[0][0]
    // 선택 관광지(1) + 식당(최대 6) 이 일정 items 로 조립된다.
    expect(arg.items.length).toBeGreaterThan(1)
    expect(arg.items.some((it) => it.type === '식당')).toBe(true)
    expect(arg.items.some((it) => it.type === '관광')).toBe(true)
    expect(push).toHaveBeenCalledWith('/trips/777')
  })

  it('조건 다시 고르기로 폼으로 돌아간다', async () => {
    const wrapper = mountView()
    await flushPromises()
    await fillForm(wrapper)
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('자동 생성'))
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('어디를 둘러볼까요?')

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('조건 다시 고르기'))
      .trigger('click')
    expect(wrapper.text()).toContain('어디로 갈까요?')
  })
})
