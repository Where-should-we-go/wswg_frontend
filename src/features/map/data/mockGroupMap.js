// 목 그룹 지도 데이터 — docs/여행기록도메인.md 의 group_region_media.
// "지역(sido+gugun)당 대표 추억 1개". 시안(§C3) 지도 핀 + 우측 대표 추억 카드.
// 각 항목: 지역 라벨 · 미디어 타입(PHOTO|VIDEO) · 캡션 · 지도상 위치(%, 데모용) · 협업 색.
// pos/region 박스는 시안의 CSS 그리드 지도 재현용 좌표(데모). 실제 지도 연동은 추후.
// TODO(backend): GET /groups/:id/region-media 응답으로 대체(좌표는 지오코딩/타일 매핑).

// 협업 색 토큰 키 → CSS 변수(핀·지역 색). 시안 --collab-* 사용.
export const REGION_MEDIA = [
  {
    id: 1,
    regionLabel: "부산 · 해운대구",
    sido_code: 26,
    gugun_code: 1,
    mediaType: "PHOTO",
    caption: "일출 · 7월 1일",
    thumbnail: "",
    collab: "collab-1",
    pin: { left: "30%", top: "34%" },
    region: { left: "18%", top: "22%", width: "120px", height: "90px" },
  },
  {
    id: 2,
    regionLabel: "부산 · 사하구",
    sido_code: 26,
    gugun_code: 3,
    mediaType: "VIDEO",
    caption: "감천마을 · 7월 1일",
    thumbnail: "",
    collab: "collab-2",
    pin: { left: "60%", top: "58%" },
    region: { left: "52%", top: "48%", width: "100px", height: "80px" },
  },
  {
    id: 3,
    regionLabel: "부산 · 수영구",
    sido_code: 26,
    gugun_code: 4,
    mediaType: "PHOTO",
    caption: "광안리 야경 · 7월 2일",
    thumbnail: "",
    collab: "collab-3",
    pin: { left: "44%", top: "24%" },
    region: null,
  },
];

// 미디어 타입 → 핀 이모지(시안 📷/🎥).
export const MEDIA_EMOJI = { PHOTO: "📷", VIDEO: "🎥" };
