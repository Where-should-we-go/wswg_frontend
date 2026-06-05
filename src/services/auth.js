const ACCESS_TOKEN_KEY = 'wswg.accessToken'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function startOAuthLogin(provider) {
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
  const response = await authFetch('/auth/me')

  if (!response.ok) {
    throw new Error('사용자 정보를 불러오지 못했습니다.')
  }

  return response.json()
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
