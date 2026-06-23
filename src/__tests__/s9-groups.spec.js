import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import GroupsView from '@/views/GroupsView.vue'

// 모임 서비스 mock — getGroups 로 2개 모임, getGroup 으로 상세 멤버 반환.
const getGroups = vi.fn()
const getGroup = vi.fn()
const removeMember = vi.fn()

vi.mock('@/services/groups', () => ({
  getGroups: (...a) => getGroups(...a),
  getGroup: (...a) => getGroup(...a),
  removeMember: (...a) => removeMember(...a),
  createGroup: vi.fn(),
  createInviteLink: vi.fn(),
  addMember: vi.fn(),
}))

vi.mock('vue-sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
  useRoute: () => ({ query: {} }),
  RouterLink: { template: '<a><slot /></a>' },
}))

const stubs = {
  RouterLink: { template: '<a><slot /></a>' },
}

function factory() {
  return mount(GroupsView, {
    global: { stubs },
  })
}

const SAMPLE = [
  {
    groupId: 5,
    groupName: '제주 뽀개기',
    emoji: '🌴',
    tripCount: 2,
    memberCount: 2,
    members: [
      { userId: 'u1', name: '김태호', profileImageUrl: '', role: 'OWNER' },
      { userId: 'u2', name: '이민지', profileImageUrl: '', role: 'MEMBER' },
    ],
  },
  {
    groupId: 6,
    groupName: '회사 워크샵',
    emoji: '💼',
    tripCount: 1,
    memberCount: 1,
    members: [{ userId: 'u1', name: '김태호', profileImageUrl: '', role: 'OWNER' }],
  },
]

describe('S9 GroupsView', () => {
  beforeEach(() => {
    getGroups.mockReset()
    getGroup.mockReset()
    push.mockClear()
  })

  it('로딩 후 모임 리스트와 제목·CTA 를 렌더한다', async () => {
    getGroups.mockResolvedValue(SAMPLE)
    getGroup.mockResolvedValue(SAMPLE[0])

    const wrapper = factory()
    await flushPromises()

    expect(wrapper.text()).toContain('모임')
    expect(wrapper.text()).toContain('새 모임')
    expect(wrapper.text()).toContain('제주 뽀개기')
    expect(wrapper.text()).toContain('회사 워크샵')
  })

  it('모임이 없으면 빈 상태 카피를 보여준다', async () => {
    getGroups.mockResolvedValue([])

    const wrapper = factory()
    await flushPromises()

    expect(wrapper.text()).toContain('아직 모임이 없어요!')
    expect(wrapper.text()).toContain('첫 모임을 만들어 친구를 불러볼까요?')
  })

  it('모임 카드를 누르면 상세를 불러온다', async () => {
    getGroups.mockResolvedValue(SAMPLE)
    getGroup.mockResolvedValue(SAMPLE[0])

    const wrapper = factory()
    await flushPromises()
    getGroup.mockClear()

    await wrapper.findAll('[role="button"]')[0].trigger('click')
    await flushPromises()

    expect(getGroup).toHaveBeenCalledWith(5)
  })
})
