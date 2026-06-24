<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { setAccessToken } from '@/services/auth'

const route = useRoute()
const router = useRouter()
const message = ref('로그인 결과를 확인하는 중입니다.')

onMounted(() => {
  const token = route.query.accessToken

  if (!token || Array.isArray(token)) {
    message.value = '액세스 토큰을 찾을 수 없습니다.'
    return
  }

  setAccessToken(token)
  message.value = '로그인되었습니다. 이동합니다.'

  router.replace({ name: 'attractions' })
})
</script>

<template>
  <main class="callback-page">
    <p role="status">{{ message }}</p>
  </main>
</template>

<style scoped>
.callback-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  color: #1d4ed8;
  background:
    radial-gradient(circle at 12% 10%, rgba(96, 165, 250, 0.24), transparent 30%),
    linear-gradient(135deg, #f7fbff 0%, #eef6ff 48%, #eaf2ff 100%);
  font-weight: 800;
}

.callback-page p {
  padding: 18px 22px;
  border: 1px solid #d7e6ff;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 36px rgba(30, 64, 175, 0.1);
}
</style>
