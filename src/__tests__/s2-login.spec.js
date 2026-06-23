import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LoginView from '@/views/LoginView.vue'

// 인증 서비스 mock: 로그인 안 된 상태 + startOAuthLogin 스파이.
const startOAuthLogin = vi.fn()
vi.mock('@/services/auth', () => ({
  isAuthenticated: () => false,
  startOAuthLogin: (provider) => startOAuthLogin(provider),
}))

// 토스트는 부수효과만 — no-op 으로 둔다.
vi.mock('vue-sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const replace = vi.fn()
const stubs = {
  RouterLink: { template: '<a><slot /></a>' },
}

function factory() {
  return mount(LoginView, {
    global: {
      stubs,
      mocks: {
        $route: { query: {} },
        $router: { replace },
      },
    },
  })
}

describe('S2 LoginView', () => {
  beforeEach(() => {
    startOAuthLogin.mockClear()
    replace.mockClear()
  })

  it('헤드라인과 소셜 버튼 2개, 약관 마이크로카피를 렌더한다', () => {
    const wrapper = factory()
    expect(wrapper.text()).toContain('어디갈래에 오신 걸 환영해요!')
    expect(wrapper.text()).toContain('소셜 계정으로 바로 시작해요')

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(wrapper.text()).toContain('구글로 시작하기')
    expect(wrapper.text()).toContain('카카오로 시작하기')

    // 이메일/비번 폼 없음
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)

    expect(wrapper.text()).toContain('이용약관과 개인정보 처리방침에 동의하는 것으로 볼게요')
  })

  it('구글 버튼 클릭 시 startOAuthLogin("google") 호출 + 로딩 안내 노출', async () => {
    const wrapper = factory()
    const googleBtn = wrapper.findAll('button')[0]

    await googleBtn.trigger('click')
    await flushPromises()

    expect(startOAuthLogin).toHaveBeenCalledWith('google')
    expect(wrapper.text()).toContain('잠깐만요, 로그인하고 있어요…')
  })
})
