import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AttractionsAdminView from '@/views/admin/AttractionsAdminView.vue'

// matchMedia 스텁 — jsdom 미구현. matches 값을 바꿔 데스크탑/모바일 분기를 테스트해요.
function stubMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function mountView() {
  return mount(AttractionsAdminView, {
    global: {
      stubs: { teleport: true, 'router-link': true },
    },
  })
}

describe('S-ADM 관광지 관리', () => {
  beforeEach(() => {
    stubMatchMedia(true) // 기본: 데스크탑
  })

  it('데스크탑에서 헤더·필터·액션 버튼이 렌더된다', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('관광지 관리')
    expect(wrapper.text()).toContain('관광지 정보를 깔끔하게 관리해요')
    expect(wrapper.text()).toContain('TourAPI 동기화')
    expect(wrapper.text()).toContain('관광지 추가')
    expect(wrapper.text()).toContain('마지막 적재 시각')
  })

  it('mock 목록이 로드되면 행과 총 건수가 표시된다', async () => {
    const wrapper = mountView()
    await flushPromises()
    // mock 서비스는 setTimeout 지연이 있어 한 번 더 기다려요.
    await new Promise((r) => setTimeout(r, 500))
    await flushPromises()
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('경복궁')
    expect(wrapper.text()).toContain('총')
    expect(wrapper.text()).toContain('건')
  })

  it('모바일 뷰포트에서는 미지원 안내만 노출된다', async () => {
    stubMatchMedia(false)
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('관광지 관리는 데스크탑에서 이용해주세요')
    expect(wrapper.find('table').exists()).toBe(false)
  })
})
