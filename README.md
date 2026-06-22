# 어디갈래? (WSWG) — Frontend

> 협업 여행 플래너 "어디갈래?"의 프론트엔드. Vue 3 + Vite 기반, 노션식 블록 에디터로 여행 계획을 작성/공동 편집합니다.

## 🚀 시작하기 전에 (필독)

이 레포는 **사람 + AI 도구(Claude Code / Codex / Gemini)** 가 함께 작업합니다. 합류하면 아래를 먼저 보세요.

- **[AGENTS.md](./AGENTS.md)** ← 기술 스택·명령어·Git 작업 방식·커밋/PR 규칙·도메인 용어·디자인 토큰의 **단일 원본**.
- AI 도구는 이 규칙을 **자동으로** 읽습니다:
  - Claude Code → `CLAUDE.md` (→ `@AGENTS.md` import)
  - Gemini CLI → `GEMINI.md` (→ `@AGENTS.md` import)
  - Codex → `AGENTS.md` 직접 인식
  - 즉 세 도구 모두 **같은 규칙**으로 동작합니다. 별도 설정 불필요.
- 사람은 AGENTS.md를 통독하고, 최초 1회 로컬 설정을 실행하세요:
  ```sh
  git config pull.rebase true
  git config branch.autoSetupRebase always
  ```

> ℹ️ 이 레포의 기본 브랜치는 **`master`** 입니다.

## 기술 스택

Vue 3.5 · Vite 8 · **pnpm** · Pinia · vue-router · Tailwind CSS 4 · reka-ui(shadcn-vue 패턴) · Pretendard · Vitest

## 프로젝트 셋업

```sh
pnpm install        # 의존성 설치
pnpm dev            # 개발 서버 (Hot-Reload)
pnpm build          # 프로덕션 빌드
pnpm test:unit      # 단위 테스트 (Vitest)
pnpm lint           # oxlint + eslint
pnpm format         # prettier 포맷
```

> 패키지 매니저는 **pnpm만** 사용합니다 (npm/yarn 금지 — lock 파일 일관성).

## 디렉토리 한눈에

```
src/
├── components/ui/   공용 UI (reka-ui 기반)
├── features/        trip(블록 에디터) · place(검색) · map(그룹 지도)
├── layouts/         AppShell · AppSidebar · AppTopicBar
├── views/           라우트 화면
├── router/ services/ stores/ assets/
```

자세한 구조·도메인 용어·디자인 토큰은 [AGENTS.md](./AGENTS.md) 참고.

## 작업 방식 (요약)

- **GitHub Flow**: `master` 직접 push 금지, 브랜치 → PR → 리뷰 1명 승인 → merge
- **merge 전 최신 master에 rebase** 후 `git push --force-with-lease` (일반 merge, squash 안 함)
- **TDD**: 구현 전에 실패하는 테스트부터 작성
- 커밋/PR 컨벤션, 하지 말 것 등 **전체 규칙은 [AGENTS.md](./AGENTS.md)** 에 있습니다.

## 권장 IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (Vetur 비활성화).
설정 참고: [Vite Configuration Reference](https://vite.dev/config/)
