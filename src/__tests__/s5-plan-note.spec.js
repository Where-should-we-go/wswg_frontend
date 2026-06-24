import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PlanNewView from '@/views/PlanNewView.vue'

// 라우터 스텁.
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

// 옵션 로드는 즉시 resolve(타이머 없이) 되도록 서비스 모킹.
vi.mock('@/services/attractions', () => ({
  getSidos: vi.fn(async () => [{ sidoCode: 1, sidoName: '서울' }]),
  getGuguns: vi.fn(async () => []),
}))
vi.mock('@/services/groups', () => ({
  getGroups: vi.fn(async () => []),
}))
const autoGeneratePlan = vi.fn(async () => ({ tripId: 99 }))
vi.mock('@/services/trips', () => ({
  autoGeneratePlan: (...args) => autoGeneratePlan(...args),
}))

function mountView() {
  return mount(PlanNewView, { global: { stubs: { 'router-link': true } } })
}

describe('S5 자유 서술 입력', () => {
  beforeEach(() => {
    autoGeneratePlan.mockClear()
    push.mockClear()
  })

  it('자유 서술 textarea 가 렌더되고 글자 수 카운터가 갱신된다', async () => {
    const wrapper = mountView()
    await flushPromises()
    const ta = wrapper.find('textarea')
    expect(ta.exists()).toBe(true)
    await ta.setValue('조용한 곳에서 쉬고 싶어요') // 14자
    expect(wrapper.text()).toContain('14/500')
  })

  it('작성한 내용이 자동 생성 요청 본문(note)에 담겨 전달된다', async () => {
    const wrapper = mountView()
    await flushPromises()

    // 필수 입력 채우기: 지역 + 기간 + 스타일.
    await wrapper.find('select').setValue(1) // 시/도 = 서울
    const dates = wrapper.findAll('input[type="date"]')
    await dates[0].setValue('2026-07-01')
    await dates[1].setValue('2026-07-03')
    const styleBtn = wrapper.findAll('button').find((b) => b.text().includes('자연'))
    await styleBtn.trigger('click')

    // 자유 서술 작성.
    await wrapper.find('textarea').setValue('  맛집 위주로 부탁해요  ')

    const genBtn = wrapper.findAll('button').find((b) => b.text().includes('자동 생성'))
    expect(genBtn.attributes('disabled')).toBeUndefined()
    await genBtn.trigger('click')
    await flushPromises()

    expect(autoGeneratePlan).toHaveBeenCalledTimes(1)
    // 앞뒤 공백은 trim 되어 전달된다.
    expect(autoGeneratePlan.mock.calls[0][0]).toMatchObject({ note: '맛집 위주로 부탁해요' })
  })
})
