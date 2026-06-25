import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PlanNewView from '@/views/PlanNewView.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

vi.mock('@/services/attractions', () => ({
  getSidos: vi.fn(async () => []),
  getGuguns: vi.fn(async () => []),
}))

vi.mock('@/services/groups', () => ({
  getGroups: vi.fn(async () => [
    {
      groupId: 10,
      groupName: '싸피 10',
      memberCount: 3,
    },
  ]),
}))

describe('S5 모임 선택 라벨', () => {
  it('모임 emoji가 없어도 undefined를 표시하지 않는다', async () => {
    const wrapper = mount(PlanNewView, {
      global: { stubs: { 'router-link': true } },
    })

    await flushPromises()

    const optionLabels = wrapper.findAll('option').map((option) => option.text())
    expect(optionLabels).toContain('싸피 10')
    expect(wrapper.text()).not.toContain('undefined')
  })
})
