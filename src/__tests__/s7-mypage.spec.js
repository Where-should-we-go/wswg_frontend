import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import MyPageView from '../views/MyPageView.vue'

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/mypage', component: MyPageView },
      { path: '/plans/new', component: { template: '<div />' } },
      { path: '/trips/:id', component: { template: '<div />' } },
      { path: '/groups', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = makeRouter()
  router.push('/mypage')
  await router.isReady()
  const wrapper = mount(MyPageView, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('S7 MyPageView', () => {
  it('페이지 헤더와 탭을 렌더한다', async () => {
    const { wrapper } = await mountView()
    expect(wrapper.find('h1').text()).toBe('내 여행')
    expect(wrapper.text()).toContain('새 여행 만들기')
    expect(wrapper.text()).toContain('참여중 여행')
  })

  it('로딩이 끝나면 mock 여행 카드를 보여준다', async () => {
    const { wrapper } = await mountView()
    // mockDelay 를 흘려보낸다.
    await new Promise((r) => setTimeout(r, 350))
    await flushPromises()
    expect(wrapper.text()).toContain('부산 2박 3일')
  })

  it('새 여행 만들기는 /plans/new 로 이동한다', async () => {
    const { wrapper, router } = await mountView()
    const push = vi.spyOn(router, 'push')
    const btn = wrapper.findAll('button').find((b) => b.text().includes('새 여행 만들기'))
    await btn.trigger('click')
    expect(push).toHaveBeenCalledWith('/plans/new')
  })
})
