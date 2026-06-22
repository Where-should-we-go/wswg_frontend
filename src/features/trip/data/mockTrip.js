// 목 여행 데이터 — docs/여행기록도메인.md 의 `trips.data` JSONB 구조 한 건(부산 2박3일).
// items[] 블록 스키마(도메인 정답):
//   content_id : 관광지(attractions 소프트참조)일 때만 number, 아니면 null
//   title      : 블록 제목
//   type       : 관광 | 식당 | 이동 | 메모 | 숙소  (한글 원문 — UI 매핑은 typeKey 헬퍼)
//   lat / lng  : 좌표(장소 항목만, 이동·메모는 없을 수 있음)
//   visitDate  : "YYYY-MM-DD" — 일차 그룹핑 키
//   time       : "HH:mm" (선택)
//   order      : 같은 날 내 정렬 순서
//   media[]    : { type: PHOTO|VIDEO, url, metadata{} }
//   properties : 자유 필드(memo·budget·rating·예약번호·duration·checkIn·transport …)
//
// 시안(artifact/design-flow.html §B) 내용과 정렬하되 스키마는 도메인 문서를 따른다.
// TODO(backend): 실제로는 GET /trips/:id 응답의 data(JSONB)로 대체.

export const mockTrip = {
  trip_id: 10,
  title: "부산 2박 3일",
  group_id: 5,
  user_id: null,
  start_date: "2026-07-01",
  end_date: "2026-07-03",

  // 페이지 메타(상단 커버·아이콘·속성 테이블 소스)
  cover: null, // 그라데이션 커버(이미지 없음). TODO(backend): 커버 이미지 URL
  icon: "🏖️",
  region: { label: "부산", sido_code: 26 },
  budgetLabel: "1인 18만원",
  styles: [
    { label: "액티비티", emoji: "🎢", type: "food" },
    { label: "힐링", emoji: "🏖️", type: "record" },
  ],

  // 동행(협업자). color 미지정 시 AvatarStack 이 --collab-* 라운드로빈 배정.
  members: [
    { id: "u1", name: "태호", initial: "태", color: "var(--collab-1)" },
    { id: "u2", name: "민지", initial: "민", color: "var(--collab-2)" },
    { id: "u3", name: "준영", initial: "준", color: "var(--collab-3)" },
  ],

  // 실시간 편집 중 표시(협업). blockId 가 가리키는 블록에 카렛 렌더.
  // TODO(backend): Redis presence 채널 수신값으로 대체.
  presence: [
    { memberId: "u2", blockId: "b-2", color: "var(--collab-2)" },
  ],

  data: {
    items: [
      // ── 1일차 ──
      {
        id: "b-1",
        content_id: 126508, // 관광지 → TourAPI 소프트참조 있음
        title: "해운대 해수욕장",
        type: "관광",
        lat: 35.158,
        lng: 129.16,
        visitDate: "2026-07-01",
        time: "10:00",
        order: 1,
        media: [
          { type: "PHOTO", url: "", metadata: { w: 4032, h: 3024 } },
          { type: "VIDEO", url: "", metadata: { durationSec: 15 } },
        ],
        properties: { duration: "1시간", memo: "일출 명소", region: "부산 해운대구" },
      },
      {
        id: "b-2",
        content_id: null, // TourAPI 에 없는 맛집 → 직접 추가
        title: "속씨원한 돼지국밥",
        type: "식당",
        lat: 35.15,
        lng: 129.05,
        visitDate: "2026-07-01",
        time: "12:30",
        order: 2,
        media: [],
        properties: { budget: 9000, rating: 5 },
      },
      {
        id: "b-3",
        content_id: 126511,
        title: "감천문화마을",
        type: "관광",
        lat: 35.097,
        lng: 129.011,
        visitDate: "2026-07-01",
        time: "15:00",
        order: 3,
        media: [{ type: "PHOTO", url: "", metadata: { w: 4032, h: 3024 } }],
        properties: { duration: "2시간", region: "부산 사하구" },
      },
      {
        id: "b-4",
        content_id: null,
        title: "광안리 오션뷰 호텔",
        type: "숙소",
        lat: 35.153,
        lng: 129.118,
        visitDate: "2026-07-01",
        time: "19:00",
        order: 4,
        media: [],
        properties: { budget: 120000, checkIn: "19:00", 예약번호: "HT-9921" },
      },

      // ── 2일차 ──
      {
        id: "b-5",
        content_id: null,
        title: "호텔 → 광안대교",
        type: "이동",
        visitDate: "2026-07-02",
        time: "09:00",
        order: 1,
        media: [],
        properties: { transport: "택시 15분" },
      },
      {
        id: "b-6",
        content_id: 126540,
        title: "광안리 해변 · SUP 체험",
        type: "관광",
        lat: 35.153,
        lng: 129.118,
        visitDate: "2026-07-02",
        time: "10:00",
        order: 2,
        media: [],
        properties: { budget: 40000, duration: "2시간" },
      },
      {
        id: "b-7",
        content_id: null,
        title: "체크인 전 짐 정리하고 야경 코스 동선 다시 보기",
        type: "메모",
        visitDate: "2026-07-02",
        order: 3,
        media: [],
        properties: { memo: "준영이 카메라 챙기기" },
      },

      // ── 3일차 ──
      {
        id: "b-8",
        content_id: null,
        title: "KTX 부산역 → 서울역",
        type: "이동",
        visitDate: "2026-07-03",
        time: "15:00",
        order: 1,
        media: [],
        properties: { transport: "KTX", 예약번호: "K-2026-0703" },
      },
    ],
  },
};

export default mockTrip;
