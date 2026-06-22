import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginSuccessView from '@/views/LoginSuccessView.vue'
import MyPageView from '@/views/MyPageView.vue'
import TripsView from '@/views/TripsView.vue'
import TripEditorView from '@/views/TripEditorView.vue'
import PlaceSearchView from '@/views/PlaceSearchView.vue'
import GroupMapView from '@/views/GroupMapView.vue'
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
          // 노션식 여행 계획 블록 에디터(Step 4)
          path: 'trips/:id',
          name: 'trip-editor',
          component: TripEditorView,
        },
        {
          // 관광지 검색(Step 5 · 시안 §C4)
          path: 'places',
          name: 'places',
          component: PlaceSearchView,
        },
        {
          // 그룹 지도(Step 5 · 시안 §C3). 추후 /groups/:id/map 로 확장 가능.
          path: 'map',
          name: 'group-map',
          component: GroupMapView,
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
