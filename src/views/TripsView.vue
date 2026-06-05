<template>
  <main class="page">
    <nav class="top-nav" aria-label="주요 메뉴">
      <RouterLink to="/">WSWG</RouterLink>
      <div>
        <RouterLink to="/trips">여행지</RouterLink>
        <RouterLink to="/my">마이페이지</RouterLink>
      </div>
    </nav>

    <section class="page-heading">
      <p>Trips</p>
      <h1>가볍게 둘러보는 추천 여행지</h1>
    </section>

    <section class="trip-list">
      <article>
        <strong>서울</strong>
        <h2>도심 산책과 야경</h2>
        <p>궁궐, 한강, 골목 카페를 하루 코스로 엮기 좋은 도시 여행지입니다.</p>
      </article>
      <article>
        <strong>부산</strong>
        <h2>바다와 시장</h2>
        <p>해운대와 광안리, 전통시장을 함께 둘러보는 짧은 여행에 잘 맞아요.</p>
      </article>
      <article>
        <strong>제주</strong>
        <h2>바람과 오름</h2>
        <p>오름 산책, 해안도로 드라이브, 로컬 맛집 탐색을 한 번에 담을 수 있어요.</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 28px;
  color: #102033;
}

.top-nav,
.page-heading,
.trip-list {
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

.page-heading {
  padding: 42px 0 8px;
}

.page-heading p {
  margin: 0 0 10px;
  color: #2563eb;
  font-weight: 900;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  letter-spacing: 0;
}

.trip-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
}

article {
  min-height: 220px;
  padding: 28px;
  border: 1px solid #d7e6ff;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 249, 255, 0.98));
  box-shadow: 0 16px 42px rgba(30, 64, 175, 0.1);
}

strong {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 8px;
  color: #1d4ed8;
  background: #eaf2ff;
}

h2 {
  margin: 12px 0 10px;
  font-size: 1.25rem;
}

p {
  color: #5d7088;
  line-height: 1.65;
}

@media (max-width: 760px) {
  .page {
    padding: 18px;
  }

  .top-nav {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .trip-list {
    grid-template-columns: 1fr;
  }
}
</style>
