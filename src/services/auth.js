import { USE_MOCK } from './config'
import { CURRENT_USER } from './mock/db'

const LOGGED_OUT_KEY = 'wswg.loggedOut'
const LEGACY_ACCESS_TOKEN_KEY = 'wswg.accessToken'

let accessToken = null

localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  if (token) {
    accessToken = token
    sessionStorage.removeItem(LOGGED_OUT_KEY)
  }
}

export function clearAccessToken() {
  accessToken = null
}

export function logoutLocalSession() {
  clearAccessToken()
  sessionStorage.setItem(LOGGED_OUT_KEY, 'true')
}

export function isLoggedOut() {
  return sessionStorage.getItem(LOGGED_OUT_KEY) === 'true'
}

export function startOAuthLogin(provider) {
  sessionStorage.removeItem(LOGGED_OUT_KEY)
  window.location.assign(`/oauth2/authorization/${provider}`)
}

export async function refreshAccessToken() {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    clearAccessToken()
    throw new Error('로그인이 필요합니다.')
  }

  const data = await response.json()
  setAccessToken(data.accessToken)
  return data.accessToken
}

export async function getCurrentUser() {
  // mock 모드: 로그아웃 상태가 아니면 항상 로그인된 사용자로 본다(데모).
  if (USE_MOCK) {
    if (isLoggedOut()) {
      throw new Error('로그인이 필요합니다.')
    }
    return { ...CURRENT_USER }
  }

  const response = await authFetch('/auth/me')

  if (!response.ok) {
    throw new Error('사용자 정보를 불러오지 못했습니다.')
  }

  return response.json()
}

// 앱 부팅 시 1회: refreshToken 쿠키로 accessToken 을 무음 재발급한다.
// 새로고침/직접 URL 진입은 메모리의 accessToken 이 비어 있으므로, 가드가
// 인증 여부를 판정하기 전에 이 완료를 기다려야 한다. 실패(미로그인)는 조용히 흡수.
let bootstrapPromise = null
export function ensureAuthReady() {
  if (USE_MOCK || isLoggedOut() || getAccessToken()) {
    return Promise.resolve()
  }
  if (!bootstrapPromise) {
    bootstrapPromise = refreshAccessToken().catch(() => {})
  }
  return bootstrapPromise
}

// 라우터 가드용 동기 판정. mock 모드는 로그아웃 안 했으면 인증된 것으로 본다.
export function isAuthenticated() {
  if (USE_MOCK) {
    return !isLoggedOut()
  }
  return getAccessToken() != null
}

// mock 모드 현재 사용자 role(가드용). 실제 모드는 getCurrentUser 로 확인.
export function currentRole() {
  if (USE_MOCK) {
    return isLoggedOut() ? null : CURRENT_USER.role
  }
  return null
}

export async function authFetch(input, init = {}) {
  const token = getAccessToken()
  const headers = new Headers(init.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status !== 401) {
    return response
  }

  const nextToken = await refreshAccessToken()
  headers.set('Authorization', `Bearer ${nextToken}`)
  response = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  })

  return response
}
