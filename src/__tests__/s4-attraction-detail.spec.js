import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import AttractionDetailView from '../views/AttractionDetailView.vue'

// vue-sonner 토스트는 jsdom 에서 부수효과 없이 통과시킨다.
vi.mock('vue-sonner', () => {
  const toast = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  })
  return { toast }
})

function makeRouter(id) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/attractions/:id', name: 'attraction-detail', component: AttractionDetailView },
      { path: '/attractions', name: 'attractions', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/plans/new', name: 'plans-new', component: { template: '<div />' } },
      { path: '/trips/:id', name: 'trip', component: { template: '<div />' } },
      { path: '/', name: 'home', component: { template: '<div />' } },
    ],
  })
  router.push(`/attractions/${id}`)
  return router
}

async function mountWithRouter(id) {
  const router = makeRouter(id)
  await router.isReady()
  const wrapper = mount(AttractionDetailView, { global: { plugins: [router] } })
  // mockDelay(setTimeout) 소진 + DOM 갱신 대기
  await flushPromises()
  await vi.advanceTimersByTimeAsync(500)
  await flushPromises()
  return { wrapper, router }
}

describe('S4 관광지 상세', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // window.matchMedia 폴리필 (jsdom 미지원)
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('로딩 후 관광지 제목·소개를 렌더한다', async () => {
    const { wrapper } = await mountWithRouter(126508) // 경복궁 (mock)
    expect(wrapper.text()).toContain('경복궁')
    expect(wrapper.text()).toContain('소개')
    // tel: 링크
    expect(wrapper.html()).toContain('tel:')
  })

  it('이미지가 없으면 플레이스홀더 카피를 보여준다', async () => {
    const { wrapper } = await mountWithRouter(126511) // 감천문화마을 (firstImage1 없음)
    expect(wrapper.text()).toContain('아직 사진이 없어요.')
  })

  it('없는 id 면 404 빈 상태를 보여준다', async () => {
    const { wrapper } = await mountWithRouter(999999)
    expect(wrapper.text()).toContain('찾는 관광지가 없어요. 다른 곳을 둘러볼까요?')
    expect(wrapper.text()).toContain('검색으로 가기')
  })
})
