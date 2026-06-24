import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PlanNewView from '@/views/PlanNewView.vue'

// 모임 없이(개인 여행) 진입 → 인원 기본값은 1명이어야 한다.
// (기본 선택이 '개인 여행 (모임 없이)' 인데 인원이 2로 시작하던 버그 회귀 방지)
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

describe('S5 인원 기본값 = 개인 여행 1명', () => {
  it('모임 없이 진입하면 인원이 1명으로 시작한다', async () => {
    const wrapper = mount(PlanNewView, {
      global: { stubs: { 'router-link': true } },
    })
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 400))
    await flushPromises()
    expect(wrapper.text()).toContain('1명')
    expect(wrapper.text()).not.toContain('2명')
  })
})
