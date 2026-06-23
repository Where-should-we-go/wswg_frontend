import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PlanNewView from '@/views/PlanNewView.vue'

// 라우터는 스텁(이동만 확인).
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() }),
}))

function mountView() {
  return mount(PlanNewView, {
    global: {
      stubs: { 'router-link': true },
    },
  })
}

describe('S5 여행 자동 생성', () => {
  it('폼 캔버스와 생성 버튼이 렌더된다', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('여행 자동 생성')
    expect(wrapper.text()).toContain('자동 생성')
    // 스타일 칩이 그려진다.
    expect(wrapper.text()).toContain('자연')
    expect(wrapper.text()).toContain('맛집')
  })

  it('초기 상태에서는 자동 생성 버튼이 비활성이다', async () => {
    const wrapper = mountView()
    await flushPromises()
    const btn = wrapper.findAll('button').find((b) => b.text().includes('자동 생성'))
    expect(btn).toBeTruthy()
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('종료일이 시작일보다 빠르면 경고 카피가 뜨고 버튼이 비활성이다', async () => {
    const wrapper = mountView()
    await flushPromises()
    const dates = wrapper.findAll('input[type="date"]')
    await dates[0].setValue('2026-07-10')
    await dates[1].setValue('2026-07-05')
    expect(wrapper.text()).toContain('돌아오는 날이 떠나는 날보다 빨라요')
    const btn = wrapper.findAll('button').find((b) => b.text().includes('자동 생성'))
    expect(btn.attributes('disabled')).toBeDefined()
  })
})
