import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginSuccessView from '@/views/LoginSuccessView.vue'
import MyPageView from '@/views/MyPageView.vue'
import TripsView from '@/views/TripsView.vue'
import AppShell from '@/layouts/AppShell.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 풀스크린(셸 없음): 랜딩 · 로그인
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login/success',
      name: 'login-success',
      component: LoginSuccessView,
    },
    // 앱 내부(AppShell 적용): layout route 로 감싸고 본문은 <RouterView/>.
    // 추후 에디터 등 앱 내부 화면도 이 children 에 추가.
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: 'trips',
          name: 'trips',
          component: TripsView,
        },
        {
          path: 'my',
          name: 'my',
          component: MyPageView,
        },
      ],
    },
  ],
})

export default router
