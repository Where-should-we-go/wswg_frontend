<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
  refreshAccessToken,
  startOAuthLogin,
} from '@/services/auth'

const user = ref(null)
const isLoading = ref(false)
const message = ref('')
const hasSession = ref(Boolean(getAccessToken()))

const displayName = computed(() => user.value?.name || user.value?.email || '여행자')

function login(provider) {
  startOAuthLogin(provider)
}

function logout() {
  clearAccessToken()
  user.value = null
  hasSession.value = false
  message.value = '로그아웃되었습니다.'
}

async function loadUser() {
  isLoading.value = true
  message.value = ''

  try {
    if (!getAccessToken()) {
      await refreshAccessToken()
    }

    user.value = await getCurrentUser()
    hasSession.value = true
  } catch (error) {
    clearAccessToken()
    user.value = null
    hasSession.value = false
    message.value = error.message === '로그인이 필요합니다.' ? '' : error.message
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search)

  if (params.get('loginError') === 'true') {
    message.value = '로그인 처리 중 문제가 발생했습니다.'
  }

  loadUser()
})
</script>

<template>
  <main class="page-shell">
    <nav class="top-nav" aria-label="주요 메뉴">
      <RouterLink to="/">WSWG</RouterLink>
      <div>
        <RouterLink to="/trips">여행지</RouterLink>
        <RouterLink to="/my">마이페이지</RouterLink>
      </div>
    </nav>

    <section v-if="hasSession" class="hero logged-in">
      <div>
        <p class="eyebrow">Welcome back</p>
        <h1>{{ displayName }}님, 오늘은 어디로 떠나볼까요?</h1>
        <p class="description">
          관심 있는 여행지를 둘러보고 내 여행 준비 상태를 간단히 확인해 보세요.
        </p>
        <div class="hero-actions">
          <RouterLink class="primary-link" to="/trips">여행지 보기</RouterLink>
          <RouterLink class="secondary-link" to="/my">내 정보 확인</RouterLink>
        </div>
      </div>

      <aside class="profile-card">
        <img
          v-if="user?.profileImageUrl"
          :src="user.profileImageUrl"
          alt=""
          class="profile-image"
        />
        <div v-else class="profile-fallback">{{ displayName.slice(0, 1) }}</div>
        <strong>{{ displayName }}</strong>
        <span>{{ user?.email }}</span>
        <button type="button" @click="logout">로그아웃</button>
      </aside>
    </section>

    <section v-else class="hero">
      <div>
        <p class="eyebrow">WSWG</p>
        <h1>여행을 시작하기 전에 로그인해 주세요</h1>
        <p class="description">
          Google 또는 Kakao 계정으로 로그인하고 여행지 탐색을 시작하세요.
        </p>
        <div class="login-actions">
          <button class="login-button google" type="button" @click="login('google')">
            Google 로그인
          </button>
          <button class="login-button kakao" type="button" @click="login('kakao')">
            Kakao 로그인
          </button>
        </div>
      </div>
    </section>

    <section class="quick-grid" aria-label="요약">
      <article>
        <span>01</span>
        <h2>여행지 둘러보기</h2>
        <p>지역별 여행지를 가볍게 훑어보고 마음에 드는 코스를 상상해 보세요.</p>
      </article>
      <article>
        <span>02</span>
        <h2>내 정보 확인</h2>
        <p>소셜 로그인으로 가져온 이름, 이메일, 프로필 정보를 확인할 수 있어요.</p>
      </article>
      <article>
        <span>03</span>
        <h2>계획 준비</h2>
        <p>앞으로 여행 일정, 찜 목록, 동행 관리 화면을 붙이기 좋은 구조입니다.</p>
      </article>
    </section>

    <p v-if="isLoading" class="message" role="status">사용자 정보를 불러오는 중입니다.</p>
    <p v-else-if="message" class="message" role="status">{{ message }}</p>
  </main>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  padding: 28px;
  color: #102033;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1080px;
  margin: 0 auto 40px;
  padding: 14px 18px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 14px 34px rgba(30, 64, 175, 0.08);
  backdrop-filter: blur(16px);
}

.top-nav a {
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

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 64px 48px 46px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.92)),
    linear-gradient(90deg, rgba(37, 99, 235, 0.12), transparent);
  box-shadow: 0 24px 70px rgba(30, 64, 175, 0.12);
}

.hero.logged-in {
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: center;
}

.eyebrow {
  margin: 0 0 12px;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  max-width: 720px;
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1.15;
  letter-spacing: 0;
}

.description {
  max-width: 560px;
  margin: 18px 0 0;
  color: #4b617c;
  font-size: 1.05rem;
  line-height: 1.7;
}

.login-actions,
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.login-button,
.primary-link,
.secondary-link,
.profile-card button {
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.login-button:hover,
.primary-link:hover,
.secondary-link:hover,
.profile-card button:hover {
  transform: translateY(-1px);
}

.login-button.google,
.secondary-link,
.profile-card button {
  color: #1d4ed8;
  border-color: #c7dcff;
  background: #ffffff;
}

.login-button.kakao {
  color: #181600;
  background: #fee500;
  box-shadow: 0 12px 26px rgba(254, 229, 0, 0.22);
}

.primary-link {
  display: inline-flex;
  align-items: center;
  color: #ffffff;
  background: #2563eb;
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.28);
}

.secondary-link {
  display: inline-flex;
  align-items: center;
}

.profile-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 26px;
  border: 1px solid #cfe0ff;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 20px 54px rgba(30, 64, 175, 0.14);
}

.profile-image,
.profile-fallback {
  width: 84px;
  height: 84px;
  border-radius: 50%;
}

.profile-image {
  object-fit: cover;
}

.profile-fallback {
  display: grid;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  font-size: 2rem;
  font-weight: 900;
}

.profile-card span {
  color: #62748c;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  max-width: 1080px;
  margin: 22px auto 0;
}

.quick-grid article {
  padding: 24px;
  border: 1px solid #d7e6ff;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 36px rgba(30, 64, 175, 0.08);
}

.quick-grid span {
  color: #2563eb;
  font-weight: 900;
}

.quick-grid h2 {
  margin: 12px 0 8px;
  font-size: 1.05rem;
}

.quick-grid p {
  margin: 0;
  color: #5d7088;
  line-height: 1.6;
}

.message {
  max-width: 1080px;
  margin: 20px auto 0;
  color: #34506f;
  font-weight: 800;
}

@media (max-width: 760px) {
  .page-shell {
    padding: 18px;
  }

  .top-nav,
  .top-nav div {
    gap: 14px;
  }

  .hero.logged-in,
  .quick-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 42px 24px 32px;
  }

  .top-nav {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
