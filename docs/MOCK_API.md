# Mock API ↔ 실제 백엔드 전환 가이드

이 프론트엔드는 **백엔드 없이도 전 화면이 동작**하도록 mock 데이터로 구동된다.
실제 백엔드(Spring, `localhost:8080`)가 준비되면 **플래그 하나로 즉시 전환**된다.

## 구조

```
src/services/
├── api.js        # 저수준 전송(apiGet/apiPost/apiPut/apiDelete/apiUpload). vite 프록시로 :8080
├── config.js     # USE_MOCK 플래그 · mockDelay · toQuery
├── auth.js       # 인증(+ mock 사용자)
├── attractions.js  trips.js  groups.js  groupMap.js  curation.js  mypage.js   # 도메인 모듈
└── mock/
    └── db.js     # 인메모리 mock 데이터(화면정의서 §6 필드명과 일치)
```

각 도메인 함수는 내부에서 `USE_MOCK`만 보고 분기한다. **화면 코드는 전환과 무관하게 동일**하다.

```js
export async function searchAttractions(params) {
  if (USE_MOCK) {
    await mockDelay()
    return /* 인메모리 필터 결과 */
  }
  return apiGet(`/api/attractions${toQuery(params)}`)   // ← 실제 경로(이미 작성됨)
}
```

## 전환 방법

기본은 **mock ON**. 실제 백엔드로 붙이려면 프로젝트 루트에 `.env.local`을 만들고:

```bash
VITE_USE_MOCK=false
```

그러고 `pnpm dev`를 재시작하면 끝. 모든 도메인 모듈이 실제 REST 경로로 요청한다(vite가 `/api`·`/auth`·`/oauth2`를 `localhost:8080`으로 프록시).

> 일부 도메인만 실제로 붙이고 싶으면, 해당 모듈 함수의 `if (USE_MOCK) { ... }` 분기만 제거하면 된다.

## 규약

- **화면은 `fetch`/`apiGet`을 직접 호출하지 않는다.** 항상 `services/<도메인>.js` 함수를 쓴다.
- 응답은 **평문 JSON**(봉투 `{success,data,error}` 없음) — 기존 `api.js`·스토어 규약과 일치.
- 백엔드 응답 형태가 다르면 **도메인 모듈의 실제 분기에서만** 매핑을 조정하면 된다(화면 영향 없음).
- mock 데이터는 `src/services/mock/db.js`에서 세션 동안 가변(생성/수정/삭제 반영, 새로고침 시 초기화).

## 실시간(WebSocket)

S6 여행 편집의 실시간 공동 편집(`WS /ws/plans/{tripId}`)은 현재 **mock 단계에서 stub**이다(로컬 낙관적 업데이트 + 가짜 프레즌스). 실제 WS·Redis 연동은 백엔드 준비 후 별도 작업.
