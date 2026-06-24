import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PlanNewView from '@/views/PlanNewView.vue'

// 라우터 스텁.
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

// 옵션 로드 즉시 resolve.
vi.mock('@/services/attractions', () => ({
  getSidos: vi.fn(async () => [{ sidoCode: 1, sidoName: '서울' }]),
  getGuguns: vi.fn(async () => []),
}))
vi.mock('@/services/groups', () => ({
  getGroups: vi.fn(async () => []),
}))

// AI 3단계 서비스 모킹(순수 헬퍼 buildTripMessage 는 실제 사용).
const createTripCandidates = vi.fn(async () => ({
  sessionId: 's1',
  reply: '후보를 골라봤어요.',
  candidates: [
    { candidateId: 'c1', name: '경복궁', regionHint: '서울 종로구', reason: '추천 이유' },
    { candidateId: 'c2', name: '북촌한옥마을', regionHint: '서울 종로구' },
  ],
  nextQuestion: '',
}))
const recommendTrip = vi.fn(async () => ({
  sessionId: 's1',
  reply: '실제 관광지를 정리했어요.',
  recommendations: [{ contentId: 126508, title: '경복궁', similarity: 0.91, score: 0.83 }],
  nextQuestion: '',
}))
const createAiTripPlan = vi.fn(async () => ({ tripId: 777, title: '서울 1박 2일' }))
vi.mock('@/services/aiTrip', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createTripCandidates: (...a) => createTripCandidates(...a),
    recommendTrip: (...a) => recommendTrip(...a),
    createAiTripPlan: (...a) => createAiTripPlan(...a),
  }
})

function mountView() {
  return mount(PlanNewView, { global: { stubs: { 'router-link': true } } })
}

// 폼 필수값(지역·기간·스타일) 채우기.
async function fillForm(wrapper) {
  await wrapper.find('select').setValue(1)
  const dates = wrapper.findAll('input[type="date"]')
  await dates[0].setValue('2026-07-01')
  await dates[1].setValue('2026-07-02')
  const styleBtn = wrapper.findAll('button').find((b) => b.text().includes('자연'))
  await styleBtn.trigger('click')
}

describe('S5 AI 후보 선택 3단계 흐름', () => {
  beforeEach(() => {
    createTripCandidates.mockClear()
    recommendTrip.mockClear()
    createAiTripPlan.mockClear()
    push.mockClear()
  })

  it('폼 → 후보 → 프리뷰 → 여행 생성까지 이어진다', async () => {
    const wrapper = mountView()
    await flushPromises()
    await fillForm(wrapper)

    // ① 후보 생성
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('자동 생성'))
      .trigger('click')
    await flushPromises()
    expect(createTripCandidates).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('마음에 드는 곳을 골라주세요')
    expect(wrapper.text()).toContain('경복궁')

    // 후보 선택 전엔 추천 버튼 비활성
    const recBtnBefore = wrapper.findAll('button').find((b) => b.text().includes('추천 받기'))
    expect(recBtnBefore.attributes('disabled')).toBeDefined()

    // 후보 1개 선택
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('경복궁'))
      .trigger('click')

    // ② 추천
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('추천 받기'))
      .trigger('click')
    await flushPromises()
    expect(recommendTrip).toHaveBeenCalledTimes(1)
    expect(recommendTrip.mock.calls[0][0]).toMatchObject({
      sessionId: 's1',
      selectedCandidateIds: ['c1'],
    })
    expect(wrapper.text()).toContain('이 관광지들로 일정을 만들까요?')

    // ③ 여행 생성 → /trips/777 이동
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('여행 만들기'))
      .trigger('click')
    await flushPromises()
    expect(createAiTripPlan).toHaveBeenCalledTimes(1)
    expect(createAiTripPlan.mock.calls[0][0]).toMatchObject({
      sessionId: 's1',
      selectedCandidateIds: ['c1'],
      startDate: '2026-07-01',
      endDate: '2026-07-02',
    })
    expect(push).toHaveBeenCalledWith('/trips/777')
  })

  it('후보 단계에서 조건 다시 고르기로 폼으로 돌아간다', async () => {
    const wrapper = mountView()
    await flushPromises()
    await fillForm(wrapper)
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('자동 생성'))
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('마음에 드는 곳을 골라주세요')

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('조건 다시 고르기'))
      .trigger('click')
    expect(wrapper.text()).toContain('어디로 갈까요?')
  })
})
