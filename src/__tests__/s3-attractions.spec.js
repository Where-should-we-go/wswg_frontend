import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import AttractionsView from '../views/AttractionsView.vue'

// vue-sonner 토스트는 jsdom 에서 부수효과 없이 통과시킨다.
vi.mock('vue-sonner', () => {
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() })
  return { toast }
})

function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/attractions', name: 'attractions', component: AttractionsView },
      {
        path: '/attractions/:id',
        name: 'attraction-detail',
        component: { template: '<div />' },
      },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/mypage', name: 'mypage', component: { template: '<div />' } },
    ],
  })
  router.push('/attractions')
  return router
}

async function mountView() {
  const router = makeRouter()
  await router.isReady()
  const wrapper = mount(AttractionsView, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('S3 관광지 검색·목록', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    window.scrollTo = vi.fn()
  })

  it('헤드라인과 검색바를 렌더한다', async () => {
    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('어디로 떠나볼까요? 가고 싶은 곳을 찾아보세요')
    // 키워드 입력 + 검색/필터 버튼이 보인다.
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.text()).toContain('검색하기')
  })

  it('로딩(스켈레톤) 이후 결과 카드를 보여준다', async () => {
    const { wrapper, router } = await mountView()
    // 초기 마운트 직후에는 스켈레톤(로딩)이 떠 있다.
    expect(wrapper.find('[data-slot="skeleton"]').exists()).toBe(true)

    // mock 지연이 끝나면 결과 카드와 결과 수가 채워진다.
    await vi.waitFor(
      () => {
        expect(wrapper.find('[data-slot="skeleton"]').exists()).toBe(false)
        expect(wrapper.text()).toContain('총')
        expect(wrapper.text()).toContain('경복궁')
      },
      { timeout: 3000, interval: 50 },
    )

    // 카드 클릭 → 상세로 라우팅.
    await wrapper.find('[role="button"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toMatch(/^\/attractions\/\d+$/)
  })

  it('맞는 결과가 없으면 빈 상태 카피를 보여준다', async () => {
    const { wrapper } = await mountView()
    await vi.waitFor(() => expect(wrapper.text()).toContain('총'), { timeout: 3000, interval: 50 })

    // 존재하지 않는 키워드로 검색 → 결과 0.
    await wrapper.find('input').setValue('절대없는키워드ZZZ')
    await wrapper.find('input').trigger('keyup', { key: 'Enter' })

    await vi.waitFor(
      () => {
        expect(wrapper.text()).toContain('찾는 곳이 없네요')
        expect(wrapper.text()).toContain('필터 초기화')
      },
      { timeout: 3000, interval: 50 },
    )
  })
})
