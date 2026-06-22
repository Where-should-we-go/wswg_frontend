// 목 관광지 데이터 — docs/여행기록도메인.md 의 attractions 마스터 한 단면.
// 필드(도메인): content_id · title · sido_code/gugun_code(+라벨) · firstImage · 휴무(rest_date) · theme.
// theme 는 UI BlockTag 타입(tour|food|stay|memo…)으로 매핑해 표시.
// 시안(§C4) 결과 행과 정렬. firstImage 는 데모상 비워 그라데이션 플레이스홀더.
// TODO(backend): GET /attractions/search?sido=&gugun=&keyword= 응답으로 대체.

// 시도 필터(시안 §C4 1행). value 는 sido_code.
export const SIDOS = [
  { value: 26, label: "부산" },
  { value: 11, label: "서울" },
  { value: 50, label: "제주" },
];

// 구군 필터(시도별). value 는 gugun_code.
export const GUGUNS = {
  26: [
    { value: 1, label: "해운대구" },
    { value: 2, label: "중구" },
    { value: 3, label: "사하구" },
  ],
  11: [
    { value: 1, label: "중구" },
    { value: 2, label: "종로구" },
  ],
  50: [
    { value: 1, label: "제주시" },
    { value: 2, label: "서귀포시" },
  ],
};

export const MOCK_ATTRACTIONS = [
  {
    content_id: 126508,
    title: "해운대 해수욕장",
    sido_code: 26,
    gugun_code: 1,
    addr: "부산 해운대구",
    firstImage: "",
    rating: 4.6,
    restDate: "",
    theme: "tour",
    themeLabel: "관광지",
  },
  {
    content_id: 127314,
    title: "감천문화마을",
    sido_code: 26,
    gugun_code: 3,
    addr: "부산 사하구",
    firstImage: "",
    rating: 4.4,
    restDate: "휴무 없음",
    theme: "stay",
    themeLabel: "문화",
  },
  {
    content_id: 129156,
    title: "광안리 해수욕장",
    sido_code: 26,
    gugun_code: 1,
    addr: "부산 수영구",
    firstImage: "",
    rating: 4.5,
    restDate: "",
    theme: "tour",
    themeLabel: "관광지",
  },
  {
    content_id: 133779,
    title: "자갈치시장",
    sido_code: 26,
    gugun_code: 2,
    addr: "부산 중구",
    firstImage: "",
    rating: 4.3,
    restDate: "매월 1·3주 화요일",
    theme: "food",
    themeLabel: "맛집",
  },
];
