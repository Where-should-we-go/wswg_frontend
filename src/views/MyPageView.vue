<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
  refreshAccessToken,
  startOAuthLogin,
} from '@/services/auth'
import { TripCreateDialog } from '@/features/trip/components'
import GroupCreateDialog from '@/features/group/components/GroupCreateDialog.vue'

const user = ref(null)
const message = ref('사용자 정보를 불러오는 중입니다.')

// 여행 생성(수동) 모달 — "＋ 새 여행"에서 연다.
const createTripOpen = ref(false)
// 그룹 생성 모달 — "＋ 새 그룹"에서 연다.
const createGroupOpen = ref(false)

const displayName = computed(() => user.value?.name || user.value?.email || '여행자')

function login(provider) {
  startOAuthLogin(provider)
}

async function loadUser() {
  try {
    if (!getAccessToken()) {
      await refreshAccessToken()
    }

    user.value = await getCurrentUser()
    message.value = ''
  } catch (error) {
    clearAccessToken()
    message.value = error.message
  }
}

onMounted(loadUser)
</script>

<template>
  <main class="page">
    <nav class="top-nav" aria-label="주요 메뉴">
      <RouterLink to="/">WSWG</RouterLink>
      <div>
        <RouterLink to="/trips">여행지</RouterLink>
        <RouterLink to="/my">마이페이지</RouterLink>
      </div>
    </nav>

    <section class="profile">
      <div v-if="user?.profileImageUrl" class="avatar image">
        <img :src="user.profileImageUrl" alt="" />
      </div>
      <div v-else class="avatar">{{ displayName.slice(0, 1) }}</div>

      <div>
        <p>My Page</p>
        <h1>{{ displayName }}님</h1>
        <div class="create-actions">
          <button class="new-trip" type="button" @click="createTripOpen = true">
            ＋ 새 여행
          </button>
          <button class="new-trip secondary" type="button" @click="createGroupOpen = true">
            ＋ 새 그룹
          </button>
        </div>
        <dl v-if="user">
          <div>
            <dt>이메일</dt>
            <dd>{{ user.email }}</dd>
          </div>
          <div>
            <dt>권한</dt>
            <dd>{{ user.role }}</dd>
          </div>
          <div>
            <dt>프로필 이미지</dt>
            <dd>{{ user.profileImageUrl || '아직 저장된 이미지가 없습니다.' }}</dd>
          </div>
        </dl>
        <div v-else class="empty-state">
          <p class="message">{{ message }}</p>
          <div v-if="message === '로그인이 필요합니다.'" class="login-actions">
            <button class="login-button google" type="button" @click="login('google')">
              Google 로그인
            </button>
            <button class="login-button kakao" type="button" @click="login('kakao')">
              Kakao 로그인
            </button>
          </div>
        </div>
      </div>
    </section>

    <TripCreateDialog v-model:open="createTripOpen" />
    <GroupCreateDialog v-model:open="createGroupOpen" />
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 28px;
  color: #102033;
}

.top-nav,
.profile {
  max-width: 1080px;
  margin-right: auto;
  margin-left: auto;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 42px;
  padding: 14px 18px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 14px 34px rgba(30, 64, 175, 0.08);
  backdrop-filter: blur(16px);
}

a {
  color: #1d4ed8;
  font-weight: 800;
  text-decoration: none;
}

.top-nav div {
  display: flex;
  gap: 8px;
}

.top-nav div a {
  padding: 8px 12px;
  border-radius: 8px;
  color: #34506f;
}

.top-nav div a:hover,
.top-nav div a.router-link-active {
  color: #1d4ed8;
  background: #eaf2ff;
}

.profile {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  padding: 34px;
  border: 1px solid #d7e6ff;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.94));
  box-shadow: 0 22px 60px rgba(30, 64, 175, 0.12);
}

.avatar {
  display: grid;
  width: 120px;
  height: 120px;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.24);
  font-size: 2.6rem;
  font-weight: 900;
}

.avatar.image {
  overflow: hidden;
  background: #eaf2ff;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

p {
  margin: 0 0 10px;
  color: #2563eb;
  font-weight: 900;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 16px;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  letter-spacing: 0;
}

.create-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 24px;
}

.new-trip {
  padding: 9px 16px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  background: #2563eb;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.22);
  transition: transform 160ms ease;
}

.new-trip:hover {
  transform: translateY(-1px);
}

.new-trip.secondary {
  color: #1d4ed8;
  border: 1px solid #c7dcff;
  background: #ffffff;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.12);
}

dl {
  display: grid;
  gap: 14px;
  margin: 0;
}

dl div {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 14px;
}

dt {
  color: #5d7088;
  font-weight: 800;
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.message {
  color: #5d7088;
}

.empty-state {
  display: grid;
  gap: 18px;
}

.login-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.login-button {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.login-button:hover {
  transform: translateY(-1px);
}

.login-button.google {
  color: #1d4ed8;
  border-color: #c7dcff;
  background: #ffffff;
}

.login-button.kakao {
  color: #181600;
  background: #fee500;
  box-shadow: 0 12px 26px rgba(254, 229, 0, 0.22);
}

@media (max-width: 680px) {
  .page {
    padding: 18px;
  }

  .top-nav {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .profile,
  dl div {
    grid-template-columns: 1fr;
  }
}
</style>
