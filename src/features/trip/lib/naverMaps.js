// naverMaps.js — 네이버 지도 v3 JS SDK 동적 로더(싱글톤).
//
// NCP Maps 인증 키는 .env 의 VITE_NAVER_MAP_CLIENT_ID 에서 읽는다.
//   .env.local 예) VITE_NAVER_MAP_CLIENT_ID=발급받은_Client_ID
//
// 신규 NCP 콘솔에서 발급한 키는 파라미터명이 `ncpKeyId` 다.
// 구 콘솔(AI·NAVER API)에서 발급한 키라면 .env 에
//   VITE_NAVER_MAP_KEY_PARAM=ncpClientId
// 를 넣어 파라미터명을 바꿀 수 있다.

const SDK_SRC = 'https://oapi.map.naver.com/openapi/v3/maps.js'
const SCRIPT_ID = 'naver-maps-sdk'

let loadPromise = null

export function getNaverClientId() {
  return import.meta.env.VITE_NAVER_MAP_CLIENT_ID ?? ''
}

export function hasNaverClientId() {
  return !!getNaverClientId()
}

// 인증 실패(잘못된 키·미등록 URL 등)는 SDK 가 이 전역 콜백으로 알려준다.
// 컴포넌트가 onAuthFailure() 로 구독하면 키 문제를 화면에 표시할 수 있다.
const authFailureHandlers = new Set()
export function onAuthFailure(handler) {
  authFailureHandlers.add(handler)
  return () => authFailureHandlers.delete(handler)
}
if (typeof window !== 'undefined') {
  window.navermap_authFailure = () => {
    loadPromise = null
    for (const handler of authFailureHandlers) handler()
  }
}

/**
 * 네이버 지도 SDK 를 한 번만 로드하고 window.naver.maps 네임스페이스를 resolve 한다.
 * 키가 없으면 'NAVER_MAP_CLIENT_ID_MISSING' 에러로 reject 한다.
 */
export function loadNaverMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('NAVER_MAP_NO_WINDOW'))
  }
  if (window.naver?.maps) return Promise.resolve(window.naver.maps)
  if (loadPromise) return loadPromise

  const clientId = getNaverClientId()
  if (!clientId) {
    return Promise.reject(new Error('NAVER_MAP_CLIENT_ID_MISSING'))
  }
  const param = import.meta.env.VITE_NAVER_MAP_KEY_PARAM || 'ncpKeyId'

  loadPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.naver?.maps) resolve(window.naver.maps)
      else {
        loadPromise = null
        reject(new Error('NAVER_MAP_SDK_LOAD_FAILED'))
      }
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', finish, { once: true })
      existing.addEventListener(
        'error',
        () => {
          loadPromise = null
          reject(new Error('NAVER_MAP_SDK_LOAD_FAILED'))
        },
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = `${SDK_SRC}?${param}=${encodeURIComponent(clientId)}`
    script.onload = finish
    script.onerror = () => {
      loadPromise = null
      reject(new Error('NAVER_MAP_SDK_LOAD_FAILED'))
    }
    document.head.appendChild(script)
  })
  return loadPromise
}
