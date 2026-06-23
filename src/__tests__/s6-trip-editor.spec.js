import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TripEditorView from '@/views/TripEditorView.vue'
import { mockTrip } from '@/features/trip/data/mockTrip'

// 토스트는 부수효과만 — no-op.
vi.mock('vue-sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

// 인증: 소유자(u1)로 본다.
vi.mock('@/services/auth', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({ id: 'u1', name: '김태호' })),
}))

// vue-router 컴포저블 mock(useRoute/useRouter).
const push = vi.fn()
let currentRoute = { params: { id: '10' } }
vi.mock('vue-router', () => ({
  useRoute: () => currentRoute,
  useRouter: () => ({ push }),
}))

// trips 서비스 mock — getTrip/updateTrip/deleteTrip 만 사용.
const getTrip = vi.fn()
const updateTrip = vi.fn(() => Promise.resolve({}))
const deleteTrip = vi.fn(() => Promise.resolve(null))
vi.mock('@/services/trips', () => ({
  getTrip: (id) => getTrip(id),
  updateTrip: (id, body) => updateTrip(id, body),
  deleteTrip: (id) => deleteTrip(id),
}))

const stubs = {
  // reka-ui teleport/포털 컴포넌트는 jsdom 에서 거추장스러우니 가볍게 둠.
  Teleport: true,
}

function factory(route = { params: { id: '10' } }) {
  currentRoute = route
  return mount(TripEditorView, {
    global: { stubs },
  })
}

describe('S6 TripEditorView', () => {
  beforeEach(() => {
    getTrip.mockReset()
    updateTrip.mockClear()
    deleteTrip.mockClear()
    push.mockClear()
  })

  it('로딩 후 여행 제목·뷰 탭을 렌더한다', async () => {
    getTrip.mockResolvedValue(structuredClone(mockTrip))
    const wrapper = factory()
    // 로딩 스켈레톤(초기)
    await flushPromises()
    expect(getTrip).toHaveBeenCalledWith('10')
    const text = wrapper.text()
    expect(text).toContain('갤러리')
    expect(text).toContain('지도')
    expect(text).toContain('보드')
    // 제목 인풋 값
    const titleInput = wrapper.find('input[placeholder="여행 제목"]')
    expect(titleInput.exists()).toBe(true)
    expect(titleInput.element.value).toBe(mockTrip.title)
  })

  it('빈 여행이면 첫 블록 안내 빈 상태를 보여준다', async () => {
    const empty = structuredClone(mockTrip)
    empty.data.items = []
    getTrip.mockResolvedValue(empty)
    const wrapper = factory()
    await flushPromises()
    expect(wrapper.text()).toContain('아직 일정이 비어 있어요')
  })

  it('404 이면 멤버 안내 빈 상태를 보여준다', async () => {
    const err = new Error('nope')
    err.status = 404
    getTrip.mockRejectedValue(err)
    const wrapper = factory({ params: { id: '999' } })
    await flushPromises()
    expect(wrapper.text()).toContain('모임 멤버만 볼 수 있어요')
  })
})
