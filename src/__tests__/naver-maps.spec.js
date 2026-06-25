import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getNaverClientId,
  hasNaverClientId,
  loadNaverMaps,
  onAuthFailure,
} from '@/features/trip/lib/naverMaps'

// 로컬 .env.local 에 키가 있든 없든 결정적으로 돌도록 env 를 직접 스텁한다.
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('naverMaps 로더 — 키 없음', () => {
  it('키가 비어 있으면 getNaverClientId 빈 문자열, hasNaverClientId false', () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', '')
    expect(getNaverClientId()).toBe('')
    expect(hasNaverClientId()).toBe(false)
  })

  it('키가 없으면 loadNaverMaps 가 NAVER_MAP_CLIENT_ID_MISSING 로 reject', async () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', '')
    await expect(loadNaverMaps()).rejects.toThrow('NAVER_MAP_CLIENT_ID_MISSING')
  })

  it('키가 있으면 hasNaverClientId true, getNaverClientId 가 그 값을 반환', () => {
    vi.stubEnv('VITE_NAVER_MAP_CLIENT_ID', 'test-key')
    expect(getNaverClientId()).toBe('test-key')
    expect(hasNaverClientId()).toBe(true)
  })
})

describe('naverMaps — 인증 실패 콜백', () => {
  it('onAuthFailure 핸들러는 navermap_authFailure 호출 시 실행되고, 해제하면 더 호출되지 않는다', () => {
    const handler = vi.fn()
    const unsubscribe = onAuthFailure(handler)

    // SDK 가 인증 실패 시 호출하는 전역 콜백.
    window.navermap_authFailure()
    expect(handler).toHaveBeenCalledTimes(1)

    unsubscribe()
    window.navermap_authFailure()
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
