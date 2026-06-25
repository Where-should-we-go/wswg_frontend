// 인메모리 mock 데이터. 화면정의서 §6 "데이터·API" 필드명과 일치한다.
// create/update/delete 가 세션 동안 반영되도록 가변 배열/객체로 둔다(새로고침 시 초기화).
// 실제 백엔드 붙이면(services/config.js VITE_USE_MOCK=false) 이 파일은 사용되지 않는다.

// ── 지역 (TourAPI area code 계열) ──────────────────────────────
export const SIDOS = [
  { sidoCode: 1, sidoName: '서울' },
  { sidoCode: 2, sidoName: '인천' },
  { sidoCode: 3, sidoName: '대전' },
  { sidoCode: 4, sidoName: '대구' },
  { sidoCode: 5, sidoName: '광주' },
  { sidoCode: 6, sidoName: '부산' },
  { sidoCode: 7, sidoName: '울산' },
  { sidoCode: 8, sidoName: '세종' },
  { sidoCode: 31, sidoName: '경기' },
  { sidoCode: 32, sidoName: '강원' },
  { sidoCode: 33, sidoName: '충북' },
  { sidoCode: 34, sidoName: '충남' },
  { sidoCode: 35, sidoName: '경북' },
  { sidoCode: 36, sidoName: '경남' },
  { sidoCode: 37, sidoName: '전북' },
  { sidoCode: 38, sidoName: '전남' },
  { sidoCode: 39, sidoName: '제주' },
]

export const GUGUNS = {
  1: [
    { gugunCode: 1, sidoCode: 1, gugunName: '종로구' },
    { gugunCode: 2, sidoCode: 1, gugunName: '중구' },
    { gugunCode: 3, sidoCode: 1, gugunName: '용산구' },
    { gugunCode: 4, sidoCode: 1, gugunName: '마포구' },
  ],
  6: [
    { gugunCode: 1, sidoCode: 6, gugunName: '해운대구' },
    { gugunCode: 2, sidoCode: 6, gugunName: '중구' },
    { gugunCode: 3, sidoCode: 6, gugunName: '사하구' },
    { gugunCode: 4, sidoCode: 6, gugunName: '수영구' },
  ],
  39: [
    { gugunCode: 1, sidoCode: 39, gugunName: '제주시' },
    { gugunCode: 2, sidoCode: 39, gugunName: '서귀포시' },
  ],
  32: [
    { gugunCode: 1, sidoCode: 32, gugunName: '강릉시' },
    { gugunCode: 2, sidoCode: 32, gugunName: '속초시' },
  ],
  38: [
    { gugunCode: 1, sidoCode: 38, gugunName: '광양시' },
    { gugunCode: 2, sidoCode: 38, gugunName: '여수시' },
    { gugunCode: 3, sidoCode: 38, gugunName: '순천시' },
  ],
}

// 콘텐츠 타입 = 테마 (TourAPI contentTypeId)
export const CONTENT_TYPES = [
  { contentTypeId: 12, name: '관광지' },
  { contentTypeId: 14, name: '문화시설' },
  { contentTypeId: 15, name: '축제·공연' },
  { contentTypeId: 25, name: '여행코스' },
  { contentTypeId: 28, name: '레포츠' },
  { contentTypeId: 32, name: '숙박' },
  { contentTypeId: 38, name: '쇼핑' },
  { contentTypeId: 39, name: '음식점' },
]

// ── 관광지 마스터 ──────────────────────────────────────────────
export const ATTRACTIONS = [
  {
    contentId: 126508,
    title: '경복궁',
    sidoCode: 1,
    sidoName: '서울',
    gugunCode: 1,
    gugunName: '종로구',
    contentTypeId: 12,
    firstImage1: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800',
    firstImage2: '',
    addr1: '서울특별시 종로구 사직로 161',
    addr2: '',
    tel: '02-3700-3900',
    homepage: 'https://www.royalpalace.go.kr',
    overview:
      '경복궁은 조선왕조 제일의 법궁입니다. 북으로 북악산을 배경 삼고 도성의 중앙에 자리한 조선의 정궁이에요.',
    mapY: 37.5796,
    mapX: 126.977,
    mapLevel: 6,
  },
  {
    contentId: 126509,
    title: '북촌한옥마을',
    sidoCode: 1,
    sidoName: '서울',
    gugunCode: 1,
    gugunName: '종로구',
    contentTypeId: 12,
    firstImage1: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=800',
    firstImage2: '',
    addr1: '서울특별시 종로구 계동길 37',
    addr2: '',
    tel: '02-2133-1372',
    homepage: '',
    overview: '북촌한옥마을은 경복궁과 창덕궁 사이에 위치한 전통 한옥 밀집 지역이에요.',
    mapY: 37.5826,
    mapX: 126.9831,
    mapLevel: 6,
  },
  {
    contentId: 126511,
    title: '감천문화마을',
    sidoCode: 6,
    sidoName: '부산',
    gugunCode: 3,
    gugunName: '사하구',
    contentTypeId: 12,
    firstImage1: '',
    firstImage2: '',
    addr1: '부산광역시 사하구 감내2로 203',
    addr2: '',
    tel: '051-204-1444',
    homepage: '',
    overview: '한국전쟁 피란민이 모여 형성한 마을이 알록달록한 예술 마을로 재탄생했어요.',
    mapY: 35.0975,
    mapX: 129.0107,
    mapLevel: 6,
  },
  {
    contentId: 126512,
    title: '해운대 해수욕장',
    sidoCode: 6,
    sidoName: '부산',
    gugunCode: 1,
    gugunName: '해운대구',
    contentTypeId: 12,
    firstImage1: 'https://images.unsplash.com/photo-1601063476271-a159c71ab0b3?w=800',
    firstImage2: '',
    addr1: '부산광역시 해운대구 우동',
    addr2: '',
    tel: '051-749-7621',
    homepage: '',
    overview: '부산을 대표하는 해수욕장으로, 넓은 백사장과 도심 야경이 어우러져요.',
    mapY: 35.1587,
    mapX: 129.1604,
    mapLevel: 6,
  },
  {
    contentId: 126540,
    title: '광안리 해변',
    sidoCode: 6,
    sidoName: '부산',
    gugunCode: 4,
    gugunName: '수영구',
    contentTypeId: 28,
    firstImage1: '',
    firstImage2: '',
    addr1: '부산광역시 수영구 광안해변로',
    addr2: '',
    tel: '051-622-4251',
    homepage: '',
    overview: '광안대교 야경으로 유명한 해변. SUP·서핑 등 레포츠도 즐길 수 있어요.',
    mapY: 35.1532,
    mapX: 129.1186,
    mapLevel: 6,
  },
  {
    contentId: 131806,
    title: '성산일출봉',
    sidoCode: 39,
    sidoName: '제주',
    gugunCode: 2,
    gugunName: '서귀포시',
    contentTypeId: 12,
    firstImage1: 'https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=800',
    firstImage2: '',
    addr1: '제주특별자치도 서귀포시 성산읍 일출로 284-12',
    addr2: '',
    tel: '064-783-0959',
    homepage: '',
    overview: '바다 위로 솟은 분화구. 유네스코 세계자연유산으로 일출 명소예요.',
    mapY: 33.4587,
    mapX: 126.9427,
    mapLevel: 6,
  },
  {
    contentId: 131807,
    title: '협재해수욕장',
    sidoCode: 39,
    sidoName: '제주',
    gugunCode: 1,
    gugunName: '제주시',
    contentTypeId: 12,
    firstImage1: '',
    firstImage2: '',
    addr1: '제주특별자치도 제주시 한림읍 협재리',
    addr2: '',
    tel: '064-728-3895',
    homepage: '',
    overview: '에메랄드빛 바다와 비양도 전경이 아름다운 해수욕장이에요.',
    mapY: 33.3937,
    mapX: 126.2396,
    mapLevel: 6,
  },
  {
    contentId: 140110,
    title: '전주한옥마을',
    sidoCode: 37,
    sidoName: '전북',
    gugunCode: 1,
    gugunName: '전주시',
    contentTypeId: 12,
    firstImage1: 'https://images.unsplash.com/photo-1624601573012-efb68931cc8f?w=800',
    firstImage2: '',
    addr1: '전라북도 전주시 완산구 기린대로 99',
    addr2: '',
    tel: '063-282-1330',
    homepage: '',
    overview: '700여 채의 한옥이 모여 있는 마을. 한복 체험과 먹거리로 유명해요.',
    mapY: 35.815,
    mapX: 127.153,
    mapLevel: 6,
  },
  {
    contentId: 150001,
    title: '강릉 안목해변 커피거리',
    sidoCode: 32,
    sidoName: '강원',
    gugunCode: 1,
    gugunName: '강릉시',
    contentTypeId: 39,
    firstImage1: '',
    firstImage2: '',
    addr1: '강원특별자치도 강릉시 창해로14번길',
    addr2: '',
    tel: '',
    homepage: '',
    overview: '바다를 보며 커피를 즐길 수 있는 카페거리예요.',
    mapY: 37.7714,
    mapX: 128.9476,
    mapLevel: 6,
  },
  {
    contentId: 150002,
    title: '오설록 티뮤지엄',
    sidoCode: 39,
    sidoName: '제주',
    gugunCode: 2,
    gugunName: '서귀포시',
    contentTypeId: 14,
    firstImage1: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',
    firstImage2: '',
    addr1: '제주특별자치도 서귀포시 안덕면 신화역사로 15',
    addr2: '',
    tel: '064-794-5312',
    homepage: 'https://www.osulloc.com',
    overview: '드넓은 녹차밭과 차 문화 전시를 함께 즐기는 공간이에요.',
    mapY: 33.3056,
    mapX: 126.2895,
    mapLevel: 6,
  },
  {
    contentId: 150003,
    title: '남산서울타워',
    sidoCode: 1,
    sidoName: '서울',
    gugunCode: 3,
    gugunName: '용산구',
    contentTypeId: 12,
    firstImage1: 'https://images.unsplash.com/photo-1538669715315-155098f0fb1d?w=800',
    firstImage2: '',
    addr1: '서울특별시 용산구 남산공원길 105',
    addr2: '',
    tel: '02-3455-9277',
    homepage: '',
    overview: '서울 도심 전경을 한눈에 담는 전망 명소예요.',
    mapY: 37.5512,
    mapX: 126.9882,
    mapLevel: 6,
  },
  {
    contentId: 150004,
    title: '에버랜드',
    sidoCode: 31,
    sidoName: '경기',
    gugunCode: 1,
    gugunName: '용인시',
    contentTypeId: 28,
    firstImage1: '',
    firstImage2: '',
    addr1: '경기도 용인시 처인구 포곡읍 에버랜드로 199',
    addr2: '',
    tel: '031-320-5000',
    homepage: '',
    overview: '국내 최대 테마파크. 시즌별 축제와 어트랙션이 가득해요.',
    mapY: 37.2941,
    mapX: 127.2026,
    mapLevel: 6,
  },
]

// ── 인기 여행지 (S1 큐레이션) ─────────────────────────────────
export const POPULAR = [
  { contentId: 126512, name: '해운대 해수욕장', regionName: '부산 해운대구', tripCount: 128, thumbnailUrl: 'https://images.unsplash.com/photo-1601063476271-a159c71ab0b3?w=600' },
  { contentId: 131806, name: '성산일출봉', regionName: '제주 서귀포시', tripCount: 96, thumbnailUrl: 'https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=600' },
  { contentId: 126508, name: '경복궁', regionName: '서울 종로구', tripCount: 84, thumbnailUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600' },
  { contentId: 140110, name: '전주한옥마을', regionName: '전북 전주시', tripCount: 72, thumbnailUrl: 'https://images.unsplash.com/photo-1624601573012-efb68931cc8f?w=600' },
  { contentId: 126511, name: '감천문화마을', regionName: '부산 사하구', tripCount: 65, thumbnailUrl: '' },
  { contentId: 150003, name: '남산서울타워', regionName: '서울 용산구', tripCount: 58, thumbnailUrl: 'https://images.unsplash.com/photo-1538669715315-155098f0fb1d?w=600' },
  { contentId: 131807, name: '협재해수욕장', regionName: '제주 제주시', tripCount: 51, thumbnailUrl: '' },
  { contentId: 150002, name: '오설록 티뮤지엄', regionName: '제주 서귀포시', tripCount: 43, thumbnailUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600' },
]

// ── 인증 (현재 로그인 사용자) ─────────────────────────────────
export const CURRENT_USER = {
  id: 'u1',
  name: '김태호',
  email: 'th20001026@gmail.com',
  profileImageUrl: '',
  role: 'ADMIN', // mock 에선 관리자 화면(S-ADM)도 볼 수 있게 ADMIN. 데모용.
}

// ── 모임 ──────────────────────────────────────────────────────
export const GROUPS = [
  {
    groupId: 5,
    groupName: '제주 뽀개기',
    emoji: '🌴',
    tripCount: 2,
    members: [
      { userId: 'u1', name: '김태호', profileImageUrl: '', role: 'OWNER', joinedAt: '2026-05-20' },
      { userId: 'u2', name: '이민지', profileImageUrl: '', role: 'MEMBER', joinedAt: '2026-05-21' },
      { userId: 'u3', name: '박준영', profileImageUrl: '', role: 'MEMBER', joinedAt: '2026-05-22' },
    ],
  },
  {
    groupId: 6,
    groupName: '회사 워크샵',
    emoji: '💼',
    tripCount: 1,
    members: [
      { userId: 'u1', name: '김태호', profileImageUrl: '', role: 'OWNER', joinedAt: '2026-06-01' },
      { userId: 'u4', name: '최서연', profileImageUrl: '', role: 'MEMBER', joinedAt: '2026-06-02' },
    ],
  },
]

// ── 여행 문서 (trips.data, S6) — tripId 키 ───────────────────
export const TRIPS = {
  10: {
    trip_id: 10,
    title: '부산 2박 3일',
    group_id: 5,
    user_id: 'u1',
    start_date: '2026-07-01',
    end_date: '2026-07-03',
    cover: null,
    icon: '🏖️',
    region: { label: '부산', sido_code: 6 },
    budgetLabel: '1인 18만원',
    styles: ['자연', '도보', '맛집'],
    members: [
      { id: 'u1', name: '태호', initial: '태', color: 'var(--collab-1)' },
      { id: 'u2', name: '민지', initial: '민', color: 'var(--collab-2)' },
      { id: 'u3', name: '준영', initial: '준', color: 'var(--collab-3)' },
    ],
    presence: [{ memberId: 'u2', blockId: 'b-2', color: 'var(--collab-2)' }],
    data: {
      items: [
        { id: 'b-1', content_id: 126512, title: '해운대 해수욕장', type: '관광', lat: 35.1587, lng: 129.1604, visitDate: '2026-07-01', time: '10:00', durationMin: 60, order: 1, media: [{ type: 'PHOTO', url: '', metadata: { w: 4032, h: 3024 } }], properties: { memo: '일출 명소', region: '부산 해운대구' } },
        { id: 'b-2', content_id: null, title: '속씨원한 돼지국밥', type: '식당', lat: 35.15, lng: 129.05, visitDate: '2026-07-01', time: '12:30', durationMin: 60, order: 2, media: [], properties: { budget: 9000, rating: 5 } },
        { id: 'b-3', content_id: 126511, title: '감천문화마을', type: '관광', lat: 35.0975, lng: 129.0107, visitDate: '2026-07-01', time: '15:00', durationMin: 120, order: 3, media: [{ type: 'PHOTO', url: '', metadata: { w: 4032, h: 3024 } }], properties: { region: '부산 사하구', memo: '사진 명소' } },
        { id: 'b-4', content_id: null, title: '광안리 오션뷰 호텔', type: '숙소', lat: 35.153, lng: 129.118, visitDate: '2026-07-01', time: '19:00', durationMin: null, order: 4, media: [], properties: { budget: 120000, checkIn: '19:00', 예약번호: 'HT-9921' } },
        { id: 'b-5', content_id: null, title: '호텔 → 광안대교', type: '이동', visitDate: '2026-07-02', time: '09:00', durationMin: 15, order: 1, media: [], properties: { transport: '택시 15분' } },
        { id: 'b-6', content_id: 126540, title: '광안리 해변 · SUP 체험', type: '관광', lat: 35.1532, lng: 129.1186, visitDate: '2026-07-02', time: '10:00', durationMin: 120, order: 2, media: [], properties: { budget: 40000, region: '부산 수영구' } },
        { id: 'b-7', content_id: null, title: '오후는 아직 미정', type: '메모', visitDate: '2026-07-02', time: null, durationMin: null, order: 3, media: [], properties: { memo: 'F1963 / 영화의전당 중 한 곳 — 날씨 보고 정하기로 했어요.' } },
        { id: 'b-8', content_id: null, title: '광안리 회센터', type: '식당', lat: 35.1532, lng: 129.1186, visitDate: '2026-07-02', time: null, durationMin: null, order: 4, media: [], properties: { memo: '저녁 후보' } },
        { id: 'b-9', content_id: null, title: 'KTX 부산역 → 서울역', type: '이동', visitDate: '2026-07-03', time: '15:00', durationMin: 165, order: 1, media: [], properties: { transport: 'KTX 2시간 45분', 예약번호: 'K-2026-0703' } },
      ],
    },
  },
}

// ── 마이페이지 여행 카드 ─────────────────────────────────────
// groupId: 여행이 속한 모임(사이드바 모임 드롭다운 필터용).
// TODO(backend): 실 API에는 아직 트립↔모임 연결이 없어 mock 에서만 채움 — 연동되면 서버 응답으로 대체.
export const MY_TRIPS = {
  mine: [
    { tripId: 10, groupId: 5, title: '부산 2박 3일', startDate: '2026-07-01', endDate: '2026-07-03', memberCount: 3, status: '예정', thumbnailUrl: 'https://images.unsplash.com/photo-1601063476271-a159c71ab0b3?w=600' },
    { tripId: 11, groupId: 5, title: '제주 힐링 여행', startDate: '2026-05-10', endDate: '2026-05-12', memberCount: 2, status: '완료', thumbnailUrl: 'https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=600' },
  ],
  joined: [
    { tripId: 12, groupId: 6, title: '회사 워크샵', startDate: '2026-06-22', endDate: '2026-06-24', memberCount: 5, status: '진행중', thumbnailUrl: '' },
  ],
}

// ── 발자취 지도 대표 추억 (group_region_media) ───────────────
export const REGION_MEDIA = {
  5: [
    { id: 1, tripId: 10, tripTitle: '부산 2박 3일', visitDate: '2026-07-01', blockId: 'b-1', blockTitle: '해운대 해수욕장', contentId: 126512, attractionTitle: '해운대 해수욕장', sidoCode: 6, sidoName: '부산', gugunCode: 1, gugunName: '해운대구', mediaType: 'PHOTO', mediaUrl: 'https://images.unsplash.com/photo-1601063476271-a159c71ab0b3?w=600', latitude: 35.1587, longitude: 129.1604, caption: '해운대 일출 · 7월 1일' },
    { id: 2, tripId: 10, tripTitle: '부산 2박 3일', visitDate: '2026-07-01', blockId: 'b-3', blockTitle: '감천문화마을', contentId: 126511, attractionTitle: '감천문화마을', sidoCode: 6, sidoName: '부산', gugunCode: 3, gugunName: '사하구', mediaType: 'VIDEO', mediaUrl: '', latitude: 35.0975, longitude: 129.0107, caption: '감천마을 · 7월 1일' },
    { id: 3, tripId: 11, tripTitle: '제주 힐링 여행', visitDate: '2026-05-11', blockId: 'b-1', blockTitle: '성산일출봉', contentId: 131806, attractionTitle: '성산일출봉', sidoCode: 39, sidoName: '제주', gugunCode: 2, gugunName: '서귀포시', mediaType: 'PHOTO', mediaUrl: 'https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=600', latitude: 33.4587, longitude: 126.9427, caption: '성산일출봉 · 5월 11일' },
    { id: 4, tripId: 13, tripTitle: '전남 봄 여행', visitDate: '2026-04-18', blockId: 'gwangyang-1', blockTitle: '광양읍 인서리 산책', contentId: 260001, attractionTitle: '광양읍 인서리', sidoCode: 38, sidoName: '전남', gugunCode: 1, gugunName: '광양시', mediaType: 'PHOTO', mediaUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600', latitude: 34.9407, longitude: 127.6959, caption: '광양읍 인서리 · 4월 18일' },
    { id: 5, tripId: 13, tripTitle: '전남 봄 여행', visitDate: '2026-04-18', blockId: 'gwangyang-2', blockTitle: '섬진강 녹음 메모', contentId: 260002, attractionTitle: '섬진강', sidoCode: 38, sidoName: '전남', gugunCode: 1, gugunName: '광양시', mediaType: 'AUDIO', mediaUrl: '', latitude: 34.972, longitude: 127.76, caption: '섬진강 녹음 · 4월 18일' },
  ],
  6: [],
}

// ── AI 후보 선택 기반 여행 추천(목) — backend /api/ai/* 흉내 ────
// 실제 흐름: ① 자연어 → AI 후보 N개  ② 선택 후보 → pgvector 실제 관광지 추천
// ③ 추천 → trips.data.items 로 여행 생성. 목에선 ATTRACTIONS 풀로 흉내낸다.
const aiSessions = {} // sessionId -> { message, candidates(내부용 _contentId 포함) }
let aiSessionSeq = 0

// ① 후보 생성. ATTRACTIONS 앞에서 count 개를 후보처럼 변환.
export function makeAiCandidates(message, count = 8) {
  const sessionId = `mock-ai-${++aiSessionSeq}`
  const n = Math.max(1, Math.min(count, ATTRACTIONS.length))
  const candidates = ATTRACTIONS.slice(0, n).map((a, i) => ({
    candidateId: `c${i + 1}`,
    name: a.title,
    regionHint: `${a.sidoName} ${a.gugunName}`,
    description: (a.overview ?? '').slice(0, 45),
    reason: '입력하신 분위기와 잘 어울리는 곳이에요.',
    _contentId: a.contentId, // 내부 매칭용(응답에서는 제거).
  }))
  aiSessions[sessionId] = { message, candidates }
  return {
    sessionId,
    reply: '입력하신 취향으로 후보를 골라봤어요.',
    candidates: candidates.map(({ _contentId, ...rest }) => rest),
    nextQuestion: '이 중 마음에 드는 후보를 골라주세요.',
  }
}

// 관광지 → 추천(backend AiTripRecommendationDto 모양: 좌표·지역·타입 포함).
function recFromAttraction(a, i, matchedCandidate) {
  return {
    contentId: a.contentId,
    title: a.title,
    contentTypeId: a.contentTypeId ?? null,
    sidoCode: a.sidoCode ?? null,
    sidoName: a.sidoName ?? null,
    gugunCode: a.gugunCode ?? null,
    gugunName: a.gugunName ?? null,
    firstImage1: a.firstImage1 ?? '',
    latitude: a.mapY ?? null,
    longitude: a.mapX ?? null,
    addr1: a.addr1 ?? '',
    distanceMeters: null,
    similarity: Number((0.92 - i * 0.03).toFixed(2)),
    score: Number((0.86 - i * 0.03).toFixed(2)),
    matchedCandidateId: matchedCandidate?.candidateId ?? null,
    matchedCandidateName: matchedCandidate?.name ?? null,
  }
}

// 선택 후보 → 실제 관광지 추천 목록(내부 헬퍼).
// contentTypeId 가 있으면 해당 타입 풀(예: 음식점)에서, 없으면 후보 1개당 1건.
function aiRecommendList(sessionId, selectedIds = [], limit = 10, contentTypeId = null) {
  if (contentTypeId != null) {
    let pool = ATTRACTIONS.filter((a) => a.contentTypeId === contentTypeId)
    if (pool.length === 0) pool = ATTRACTIONS // mock 풀에 해당 타입이 없으면 아무거나(끼니 채움용).
    return pool.slice(0, limit).map((a, i) => recFromAttraction(a, i, null))
  }
  const sess = aiSessions[sessionId]
  const picked = (sess?.candidates ?? []).filter((c) => selectedIds.includes(c.candidateId))
  return picked.slice(0, limit).map((c, i) => {
    const a = ATTRACTIONS.find((x) => x.contentId === c._contentId) ?? {}
    return recFromAttraction({ ...a, title: c.name }, i, c)
  })
}

// ② 선택 후보 기반 추천. contentTypeId 로 타입(음식점 등) 필터 가능.
export function makeAiRecommendations(sessionId, selectedIds = [], limit = 10, contentTypeId = null) {
  return {
    sessionId,
    reply: '선택한 취향과 가까운 실제 관광지를 정리했어요.',
    recommendations: aiRecommendList(sessionId, selectedIds, limit, contentTypeId),
    nextQuestion: '이대로 여행 계획을 만들까요?',
  }
}
