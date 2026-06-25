import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import { isAuthenticated, currentRole, ensureAuthReady } from '@/services/auth'

// 화면정의서 §2.1 사이트맵. 두 종류의 셸:
//  · 간소화(게스트 탐색) — GlobalHeader 를 화면이 직접 그림. S1·S2·S3·S4.
//  · 앱 셸(워크스페이스) — AppShell 레이아웃 children. S5~S9·S-ADM.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── 간소화 셸 (셸 레이아웃 없음) ──────────────────────────
    { path: '/', name: 'landing', component: () => import('@/views/HomeView.vue') }, // S1
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') }, // S2
    {
      path: '/login/success',
      name: 'login-success',
      component: () => import('@/views/LoginSuccessView.vue'),
    }, // OAuth 콜백
    {
      path: '/attractions',
      name: 'attractions',
      component: () => import('@/views/AttractionsView.vue'),
    }, // S3
    {
      path: '/attractions/:id',
      name: 'attraction-detail',
      component: () => import('@/views/AttractionDetailView.vue'),
    }, // S4

    // ── 앱 셸 (워크스페이스 사이드바+토픽바) ─────────────────
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: 'plans/new',
          name: 'plan-new',
          component: () => import('@/views/PlanNewView.vue'),
          meta: { requiresAuth: true },
        }, // S5
        {
          path: 'trips/:id',
          name: 'trip-editor',
          component: () => import('@/views/TripEditorView.vue'),
          meta: { requiresAuth: true },
        }, // S6
        {
          path: 'mypage',
          name: 'mypage',
          component: () => import('@/views/MyPageView.vue'),
          meta: { requiresAuth: true },
        }, // S7
        {
          path: 'groups',
          name: 'groups',
          component: () => import('@/views/GroupsView.vue'),
          meta: { requiresAuth: true },
        }, // S9
        {
          path: 'groups/join',
          name: 'group-join',
          component: () => import('@/views/GroupJoinView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'groups/:id/map',
          name: 'group-map',
          component: () => import('@/views/GroupMapView.vue'),
          meta: { requiresAuth: true },
        }, // S8
        {
          path: 'admin/attractions',
          name: 'admin-attractions',
          component: () => import('@/views/admin/AttractionsAdminView.vue'),
          meta: { requiresAuth: true, requiresAdmin: true },
        }, // S-ADM
      ],
    },

    // ── 구 경로 리다이렉트(정본 정렬) ───────────────────────
    { path: '/my', redirect: '/mypage' },
    { path: '/places', redirect: '/attractions' },
    { path: '/trips', redirect: '/mypage' },

    // ── 404 ─────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// 인증·권한 가드. mock 모드(USE_MOCK)는 isAuthenticated()가 기본 true → 화면 열람 가능.
// 실모드는 부팅 무음 재발급(ensureAuthReady) 완료를 기다린 뒤 판정한다.
router.beforeEach(async (to) => {
  await ensureAuthReady()
  // 로그인 사용자가 랜딩(/)에 직접 진입하면 마케팅 페이지를 건너뛰고 탐색 허브로.
  if (to.name === 'landing' && isAuthenticated()) {
    return { name: 'attractions' }
  }
  if (to.meta?.requiresAuth && !isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta?.requiresAdmin && currentRole() !== 'ADMIN') {
    return { name: 'attractions' }
  }
  return true
})

export default router
