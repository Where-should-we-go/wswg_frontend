import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'

// vue-sonner 토스트는 jsdom 에서 부수효과 없이 통과시킨다.
vi.mock('vue-sonner', () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() })
  return { toast }
})

function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/attractions', name: 'attractions', component: { template: '<div />' } },
      {
        path: '/attractions/:id',
        name: 'attraction-detail',
        component: { template: '<div />' },
      },
      { path: '/mypage', name: 'mypage', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  return router
}

async function mountView() {
  const router = makeRouter()
  await router.isReady()
  const wrapper = mount(HomeView, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('S1 랜딩', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    window.scrollTo = vi.fn()
  })

  it('Hero 헤드라인·서브카피·CTA와 소개를 렌더한다', async () => {
    const { wrapper } = await mountView()
    expect(wrapper.text()).toContain('고르기만 하세요')
    expect(wrapper.text()).toContain('지역이랑 취향만 정하면')
    expect(wrapper.text()).toContain('시작하기')
    expect(wrapper.text()).toContain('관광지 둘러보기')
    // 서비스 소개 3가치
    expect(wrapper.text()).toContain('일정을 자동으로 짜드려요')
  })

  it('인기 섹션: 로딩 스켈레톤 이후 카드를 보여준다', async () => {
    const { wrapper } = await mountView()
    // 마운트 직후 인기 자리에 스켈레톤(로딩)이 떠 있다.
    expect(wrapper.find('[data-slot="skeleton"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('요즘 다들 여기로 떠나요')

    await vi.waitFor(
      () => {
        expect(wrapper.find('[data-slot="skeleton"]').exists()).toBe(false)
        expect(wrapper.text()).toContain('해운대 해수욕장')
        expect(wrapper.text()).toContain('개 여행에 담겼어요')
      },
      { timeout: 3000, interval: 50 },
    )
  })

  it('인기 여행지 카드 클릭 시 상세로 라우팅한다', async () => {
    const { wrapper, router } = await mountView()
    await vi.waitFor(() => expect(wrapper.text()).toContain('해운대 해수욕장'), {
      timeout: 3000,
      interval: 50,
    })
    await wrapper.find('[role="button"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toMatch(/^\/attractions\/\d+$/)
  })

  it('"시작하기" CTA는 /login 으로 이동한다', async () => {
    const { wrapper, router } = await mountView()
    await flushPromises()
    const startBtn = wrapper.findAll('button').find((b) => b.text().includes('시작하기'))
    expect(startBtn).toBeTruthy()
    await startBtn.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
