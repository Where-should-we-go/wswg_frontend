import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import GroupMapView from '@/features/map/components/GroupMapView.vue'

// vue-sonner 토스트는 테스트에서 no-op 으로 대체.
vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// useRoute 가 route param id 를 돌려주도록 mock.
const routeRef = { params: { id: '5' } }
vi.mock('vue-router', () => ({
  useRoute: () => routeRef,
}))

function mountWithRoute(id) {
  routeRef.params = { id }
  return mount(GroupMapView, {
    global: {
      stubs: {
        // reka-ui Sheet 포털은 jsdom 에서 불필요 — 마운트만 확인.
        RegionGallerySheet: true,
      },
    },
  })
}

describe('S8 GroupMapView', () => {
  it('로딩 후 대표 추억과 지도를 렌더해요 (그룹 5)', async () => {
    const wrapper = mountWithRoute('5')
    // 로딩 상태 카피
    expect(wrapper.text()).toContain('발자취를 불러오고 있어요')

    await flushPromises()
    await new Promise((r) => setTimeout(r, 450)) // mockDelay(350ms) 대기
    await flushPromises()

    expect(wrapper.text()).toContain('우리가 함께 밟은 발자취')
    expect(wrapper.text()).toContain('부산 해운대구')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('데이터가 없으면 빈 상태 카피를 보여줘요 (그룹 6)', async () => {
    const wrapper = mountWithRoute('6')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 450))
    await flushPromises()

    expect(wrapper.text()).toContain('아직 함께 다녀온 곳이 없어요')
  })
})
