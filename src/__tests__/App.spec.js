import { describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'

describe('App', () => {
  it('랜딩(/)에서 앱이 정상 마운트되고 브랜드가 보여요', async () => {
    setActivePinia(createPinia())
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    // 랜딩은 간소화 셸(GlobalHeader)에서 브랜드명을 노출한다.
    expect(wrapper.text()).toContain('어디갈래')
  })
})
