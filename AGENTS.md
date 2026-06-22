# AGENTS.md — WSWG Frontend

> 이 문서는 **사람과 AI 도구(Claude Code / Codex / Gemini)가 공유하는 단일 작업 규칙**입니다.
> `CLAUDE.md`, `GEMINI.md`는 이 파일을 가리키기만 하며, 규칙의 원본은 항상 여기입니다.
> 규칙(린트로 검사 가능한 것)은 CI/린터가 강제하고, 이 문서는 그 외의 맥락·판단을 담습니다.

## 프로젝트 한 줄 소개

"어디갈래?(WSWG)" — 협업 여행 플래너의 **프론트엔드**. 노션식 블록 에디터로 여행 계획을 작성/공동 편집한다.

- 제품 전체 방향·기능 정의: [README.md](./README.md)
- 백엔드 API/도메인: backend 레포 참조

## 기술 스택

| 구분 | 내용 |
|---|---|
| 프레임워크 | Vue 3.5 (Composition API, `<script setup>`) |
| 언어 | JavaScript (TypeScript 미사용) |
| 빌드 | Vite 8 |
| 패키지 매니저 | **pnpm** (npm/yarn 사용 금지 — `pnpm-lock.yaml` 기준) |
| 상태관리 | Pinia |
| 라우팅 | vue-router |
| 스타일 | Tailwind CSS 4 + semantic 디자인 토큰 |
| UI | reka-ui(헤드리스) 기반 shadcn-vue 패턴 (`src/components/ui`) |
| 폰트 | Pretendard |
| 테스트 | Vitest (jsdom) |
| 린트/포맷 | oxlint + eslint + prettier |

## 명령어

```bash
pnpm install         # 의존성 설치
pnpm dev             # 개발 서버
pnpm build           # 프로덕션 빌드
pnpm test:unit       # 테스트 (Vitest)
pnpm lint            # oxlint + eslint (--fix 포함)
pnpm format          # prettier 포맷 (src/)
```

## 디렉토리 구조

```
src/
├── App.vue · main.js
├── assets/styles/      globals.css (디자인 토큰 정의)
├── components/ui/       reka-ui 기반 공용 UI (Button, Dialog, Tabs ...)
├── features/            기능 도메인별 모듈
│   ├── trip/            여행 계획 블록 에디터 (components / lib / data)
│   ├── place/           관광지 검색
│   └── map/             그룹 지도
├── layouts/             AppShell · AppSidebar · AppTopicBar
├── views/               라우트 단위 화면 (HomeView, TripsView, ...)
├── router/              index.js
├── services/            API/인증 등 (auth.js)
├── stores/              Pinia 스토어
└── __tests__/           테스트
```

기능 코드는 가능하면 `features/<도메인>/` 아래에 모은다. 범용 UI는 `components/ui/`.

## 도메인 용어 (네이밍 통일)

| 한글 | 코드 네이밍 | 설명 |
|---|---|---|
| 여행 계획 | `Trip` | 블록 에디터로 편집하는 단위 (`/trips`, `/trips/:id`) |
| 블록 | `Block` | Trip을 구성하는 콘텐츠 단위 (노션식). 메타: `lib/blockMeta.js` |
| 데이파트 | `Daypart` | Day 내 시간대 구분 |
| 관광지 | `Place` | 검색 대상 (`/places`) |
| 그룹 | `Group` | 그룹 지도 (`/map`) |

## 디자인 토큰 (하드코딩 금지)

색·간격은 `src/assets/styles/globals.css`의 semantic 변수를 사용한다. hex 직접 입력 ❌.

- Primary(브랜드 블루): `--primary` = `#2c6fe3`
- Destructive: `--destructive` = `#c9453b`
- 블록 태그 색: blue / orange / gray / purple / yellow / green
- 협업 카렛: collab-1 / collab-2 / collab-3
- 포맷 규칙(prettier): 세미콜론 없음, 작은따옴표, printWidth 100

## Git 작업 방식

> ⚠️ 이 레포의 기본 브랜치는 **`master`** 입니다 (backend는 `main`). 아래 `master`를 backend에서는 `main`으로 읽으세요.

### 브랜치 전략: GitHub Flow
- `master`는 항상 배포 가능한 상태. **직접 push 금지** (PR + 리뷰 1명 이상 승인 후 merge).
- 기능마다 브랜치를 분기: `feat/검색-필터`, `fix/에디터-블록`, `refactor/스토어`

### Merge 전 최신 master에 rebase (필수)
merge 전에 브랜치를 **최신 master 위로 rebase**해 충돌을 미리 해소한다.
merge 자체는 **일반 merge(merge 커밋 유지)** 로 진행한다. (squash 안 함)

```bash
git fetch origin
git rebase origin/master         # 최신 master 위로 내 작업을 올림
# 충돌 해결 후
git push --force-with-lease      # rebase로 히스토리가 바뀌므로 force-with-lease (--force 금지)
```

- 브랜치 보호: **"Require branches to be up to date before merging"** 가 켜져 있어 최신이 아니면 merge 버튼이 막힘.
- **1 브랜치 = 1 작업자** 원칙. rebase + force-with-lease는 공유 브랜치에서 남의 커밋을 날릴 수 있으니, 한 브랜치를 둘이 같이 쓰지 않는다.

### 커밋 규칙
plain merge라 **모든 커밋이 그대로 master에 남는다.** 커밋 하나하나가 컨벤션을 지킬 것.

형식: `<type>(<scope>): <한글 요약>` (요약 50자 이내, 명령형, 마침표 없음)

| type | 용도 |
|---|---|
| feat | 새 기능 |
| fix | 버그 수정 |
| refactor | 동작 변화 없는 개선 |
| test | 테스트 추가/수정 |
| docs | 문서 |
| chore | 빌드·설정·의존성 |
| style | 포맷 등 동작 변화 없는 수정 |

예) `feat(trip): 블록 슬래시 메뉴 추가`

### PR
- 제목도 커밋 컨벤션과 동일하게.
- 본문은 [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) 양식을 채울 것 (**작성한 테스트** 섹션 필수).

### 최초 1회 로컬 설정 (온보딩)
```bash
git config pull.rebase true
git config branch.autoSetupRebase always
```

## 테스트: 테스트 먼저 작성 (TDD)
- 구현 전에 실패하는 테스트부터 작성 (Red → Green → Refactor).
- 새 로직이 있는 PR은 테스트를 동반한다.
- 위치: `src/__tests__/` (또는 대상 옆 `*.spec.js`), 프레임워크: Vitest.

## 하지 말 것
- `master`에 직접 push 금지.
- **npm / yarn 사용 금지** — pnpm만 (lock 파일 일관성).
- 색/간격 하드코딩 금지 → 디자인 토큰 사용.
- `git push --force` 금지 → `--force-with-lease`만.
- 시크릿·`.env` 커밋 금지.
- 컨벤션을 어긴 커밋 메시지 금지.
