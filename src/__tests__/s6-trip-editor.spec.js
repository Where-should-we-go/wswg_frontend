import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TripEditorView from '@/views/TripEditorView.vue'
import { useTripEditor } from '@/features/trip/lib/useTripEditor'
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

// trips 서비스 mock — getTrip/updateTrip/deleteTrip/uploadMedia.
const getTrip = vi.fn()
const updateTrip = vi.fn(() => Promise.resolve({}))
const deleteTrip = vi.fn(() => Promise.resolve(null))
const uploadMedia = vi.fn(() =>
  Promise.resolve({ mediaUrl: '', mediaType: 'PHOTO', metadata: {} }),
)
vi.mock('@/services/trips', () => ({
  getTrip: (id) => getTrip(id),
  updateTrip: (id, body) => updateTrip(id, body),
  deleteTrip: (id) => deleteTrip(id),
  uploadMedia: (id, blockId, file) => uploadMedia(id, blockId, file),
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

  it('블록에서 사진을 올리면 uploadMedia 를 호출하고 media[] 에 더한다 (E1)', async () => {
    getTrip.mockResolvedValue(structuredClone(mockTrip))
    uploadMedia.mockClear()
    uploadMedia.mockResolvedValue({ mediaUrl: 'https://x/p.jpg', mediaType: 'PHOTO', metadata: {} })
    const wrapper = factory()
    await flushPromises()

    // 미디어가 없는 블록(b-2)을 찾아 upload-media 이벤트를 직접 발생.
    const blocks = wrapper.findAllComponents({ name: 'TripBlock' })
    const target = blocks.find((b) => b.props('block').id === 'b-2')
    expect(target).toBeTruthy()
    const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' })
    target.vm.$emit('upload-media', 'b-2', [file])
    await flushPromises()

    expect(uploadMedia).toHaveBeenCalledTimes(1)
    const [tripId, blockId, uploadedFile] = uploadMedia.mock.calls[0]
    expect(tripId).toBe(10)
    expect(blockId).toBe('b-2')
    expect(uploadedFile).toBe(file)
    // media[] 에 append 되어 다시 렌더되었는지(prop 갱신).
    expect(target.props('block').media.at(-1).url).toBe('https://x/p.jpg')
  })

  it('오디오 파일을 올리면 AUDIO 미디어로 추가한다', async () => {
    getTrip.mockResolvedValue(structuredClone(mockTrip))
    uploadMedia.mockClear()
    uploadMedia.mockResolvedValue({
      mediaUrl: 'https://x/a.webm',
      mediaType: 'AUDIO',
      metadata: { originalFilename: 'a.webm' },
    })
    const wrapper = factory()
    await flushPromises()

    const blocks = wrapper.findAllComponents({ name: 'TripBlock' })
    const target = blocks.find((b) => b.props('block').id === 'b-2')
    const file = new File(['audio'], 'a.webm', { type: 'audio/webm' })
    target.vm.$emit('upload-media', 'b-2', [file])
    await flushPromises()

    expect(uploadMedia).toHaveBeenCalledWith(10, 'b-2', file)
    expect(target.props('block').media.at(-1)).toMatchObject({
      type: 'AUDIO',
      url: 'https://x/a.webm',
      metadata: { originalFilename: 'a.webm' },
    })
  })
})

describe('useTripEditor — 블록 편집 액션 (D4·E1·순서)', () => {
  function makeEd() {
    return useTripEditor(structuredClone(mockTrip))
  }

  it('addMedia 는 블록 media[] 에 항목을 더한다 (E1)', () => {
    const ed = makeEd()
    const before = ed.findBlock('b-2').media.length
    ed.addMedia('b-2', { type: 'PHOTO', url: 'u', metadata: {} })
    expect(ed.findBlock('b-2').media.length).toBe(before + 1)
    expect(ed.findBlock('b-2').media.at(-1)).toEqual({ type: 'PHOTO', url: 'u', metadata: {} })
  })

  it('patchBlock 으로 time·durationMin 을 정본 형식으로 저장한다 (D4)', () => {
    const ed = makeEd()
    ed.patchBlock('b-2', { time: '13:00', durationMin: 45 })
    expect(ed.findBlock('b-2').time).toBe('13:00')
    expect(ed.findBlock('b-2').durationMin).toBe(45)
    // 문자열 duration 을 따로 저장하지 않는다(스키마 §3).
    expect('duration' in ed.findBlock('b-2')).toBe(false)
  })

  it('patchProperty 로 budget·rating·memo 를 쓰고 빈 값이면 키를 지운다', () => {
    const ed = makeEd()
    ed.patchProperty('b-2', 'rating', 4.5)
    expect(ed.findBlock('b-2').properties.rating).toBe(4.5)
    ed.patchProperty('b-2', 'rating', '')
    expect('rating' in ed.findBlock('b-2').properties).toBe(false)
  })

  it('reorderWithin 으로 같은 날 order 를 재배치한다', () => {
    const ed = makeEd()
    // 1일차: b-1(1) b-2(2) b-3(3) b-4(4) → b-3 을 맨 앞으로.
    ed.reorderWithin('2026-07-01', ['b-3', 'b-1', 'b-2', 'b-4'])
    expect(ed.findBlock('b-3').order).toBe(1)
    expect(ed.findBlock('b-1').order).toBe(2)
    expect(ed.findBlock('b-4').order).toBe(4)
  })
})
