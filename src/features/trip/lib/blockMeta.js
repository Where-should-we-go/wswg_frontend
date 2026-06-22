// 트립 블록 도메인 헬퍼 — data.items[] 의 한글 type / properties 를
// UI 표현(BlockTag typeKey, PropertyPill 목록)으로 매핑한다.
// (디자인시스템.md §6.2 매핑표 구현의 도메인 로직 부분)

// data.type(한글) → BlockTag type prop(영문 키)
const TYPE_KEY = {
  관광: "tour",
  식당: "food",
  이동: "move",
  숙소: "stay",
  메모: "memo",
  기록: "record",
};

export function typeKeyOf(koType) {
  return TYPE_KEY[koType] ?? "tour";
}

// 슬래시 메뉴 / 새 블록에서 쓰는 블록 종류 정의(시안 §B 슬래시 팝오버).
export const BLOCK_KINDS = [
  { typeKey: "tour", koType: "관광", emoji: "📍", title: "관광지", desc: "TourAPI에서 검색해 추가" },
  { typeKey: "food", koType: "식당", emoji: "🍜", title: "식당 / 카페", desc: "직접 입력 · 예산·평점" },
  { typeKey: "move", koType: "이동", emoji: "🚄", title: "이동", desc: "교통편 · 예약번호" },
  { typeKey: "memo", koType: "메모", emoji: "📝", title: "메모", desc: "자유 텍스트" },
];

function formatBudget(won) {
  return `${Number(won).toLocaleString("ko-KR")}원`;
}

// properties 객체 → 인라인 pill 목록 [{ key, emoji, text }].
// 알려진 키는 전용 이모지/포맷, 그 외(예약번호 등)는 라벨 그대로.
// region 은 일정상 자주 쓰이므로 📌, 나머지 자유필드는 🔖.
export function propertyPills(properties = {}) {
  const pills = [];
  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined || value === "") continue;
    switch (key) {
      case "duration":
        pills.push({ key, emoji: "⏱", text: String(value) });
        break;
      case "budget":
        pills.push({ key, emoji: "💰", text: formatBudget(value) });
        break;
      case "rating":
        pills.push({ key, emoji: "⭐", text: Number(value).toFixed(1) });
        break;
      case "memo":
        pills.push({ key, emoji: "📝", text: String(value) });
        break;
      case "region":
        pills.push({ key, emoji: "📌", text: String(value) });
        break;
      case "transport":
        pills.push({ key, emoji: "🚕", text: String(value) });
        break;
      case "checkIn":
        pills.push({ key, emoji: "🛏", text: `체크인 ${value}` });
        break;
      case "예약번호":
        pills.push({ key, emoji: "🎫", text: `예약 ${value}` });
        break;
      default:
        pills.push({ key, emoji: "🔖", text: `${key} ${value}` });
    }
  }
  return pills;
}
