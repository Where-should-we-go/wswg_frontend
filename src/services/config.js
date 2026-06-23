// 백엔드 mock ↔ 실제 API 스위치.
//
// 기본값은 mock ON. 실제 백엔드(localhost:8080, vite 프록시)로 붙이려면
// 프로젝트 루트에 `.env.local` 을 만들고 아래 한 줄을 넣으면 된다:
//
//   VITE_USE_MOCK=false
//
// 도메인 서비스 모듈(services/attractions.js 등)은 이 플래그만 보고
// mock 함수 또는 실제 apiGet/apiPost/... 를 호출한다. 화면 코드는 동일.

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// mock 응답에 네트워크 지연을 흉내내 로딩 상태(Skeleton 등)를 실제처럼 확인.
export function mockDelay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 쿼리스트링 빌더 — null/undefined/'' 값은 제외.
export function toQuery(params = {}) {
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') {
      continue
    }
    if (Array.isArray(value)) {
      value.forEach((v) => usp.append(key, v))
    } else {
      usp.append(key, value)
    }
  }
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}
