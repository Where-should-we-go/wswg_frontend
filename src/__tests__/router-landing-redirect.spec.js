import { describe, it, expect, beforeEach } from 'vitest'
import router from '@/router'
import { logoutLocalSession, setAccessToken } from '@/services/auth'

// 랜딩(/) IA: 로그인 사용자는 마케팅 랜딩을 건너뛰고 탐색 허브(/attractions)로,
// 게스트는 랜딩에 머문다. (mock 모드: isAuthenticated = !isLoggedOut)
describe('라우터 가드: 랜딩(/) 진입', () => {
  beforeEach(async () => {
    sessionStorage.clear()
    await router.replace('/login')
    await router.isReady()
  })

  it('로그인 사용자가 / 로 가면 /attractions 로 리다이렉트된다', async () => {
    setAccessToken('test-token') // 로그아웃 플래그 해제 → 인증된 상태
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('attractions')
  })

  it('게스트(로그아웃)는 / 랜딩에 머문다', async () => {
    logoutLocalSession()
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('landing')
  })
})
