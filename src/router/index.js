import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginSuccessView from '@/views/LoginSuccessView.vue'
import MyPageView from '@/views/MyPageView.vue'
import TripsView from '@/views/TripsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    {
      path: '/trips',
      name: 'trips',
      component: TripsView,
    },
    {
      path: '/my',
      name: 'my',
      component: MyPageView,
    },
  ],
})

export default router
