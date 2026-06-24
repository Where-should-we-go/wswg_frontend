import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PlanNewView from '@/views/PlanNewView.vue'

// 모임(?groupId=5)으로 진입 → 인원 기본값이 그 모임 멤버 수(3명)로 맞춰진다.
// (mock GROUPS: groupId 5 '제주 뽀개기' = 멤버 3명)
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  useRoute: () => ({ query: { groupId: '5' } }),
}))

describe('S5 인원 기본값 = 모임 멤버 수', () => {
  it('모임으로 진입하면 인원이 모임 멤버 수로 설정된다', async () => {
    const wrapper = mount(PlanNewView, {
      global: { stubs: { 'router-link': true } },
    })
    // onMounted의 getGroups()는 mockDelay(setTimeout) 후 resolve → 타이머까지 대기.
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 400))
    await flushPromises()
    expect(wrapper.text()).toContain('3명')
    expect(wrapper.text()).not.toContain('2명')
  })
})
