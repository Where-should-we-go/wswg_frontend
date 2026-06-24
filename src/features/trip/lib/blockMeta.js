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

// data.type(한글) → 블록 선두 이모지 .em (시안: 📍🍜🏨…). BlockTag 이모지와 동일 계열.
const TYPE_EMOJI = {
  관광: "📍",
  식당: "🍜",
  이동: "🚄",
  숙소: "🏨",
  메모: "📝",
  기록: "✓",
};

export function typeEmojiOf(koType) {
  return TYPE_EMOJI[koType] ?? "📍";
}

// data.type(한글) → 레일 점 색 키 (시안: blue/orange/purple…). 점 border-color 용.
//   관광=blue, 식당=orange, 숙소=purple, 메모=yellow, 이동=gray.
const TYPE_RAIL_COLOR = {
  관광: "var(--tag-blue-fg)",
  식당: "var(--tag-orange-fg)",
  이동: "var(--tag-gray-fg)",
  숙소: "var(--tag-purple-fg)",
  메모: "var(--tag-yellow-fg)",
  기록: "var(--tag-green-fg)",
};

export function railColorOf(koType) {
  return TYPE_RAIL_COLOR[koType] ?? "var(--ink-3)";
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

// ── 시간/구간 헬퍼 (스키마 §3) ────────────────────────────────────────────────

// 구간(daypart) 정의: 라벨 + 노드 이모지 (시안: 🌅오전 / ☀️오후 / 🌆저녁).
export const DAYPARTS = [
  { key: "오전", label: "오전", emoji: "🌅" },
  { key: "오후", label: "오후", emoji: "☀️" },
  { key: "저녁", label: "저녁", emoji: "🌆" },
  { key: "미정", label: "미정", emoji: "🕗" }, // 노드로는 거의 안 씀(끝에 묶음)
];

const DAYPART_BY_KEY = Object.fromEntries(DAYPARTS.map((d) => [d.key, d]));

export function daypartMeta(key) {
  return DAYPART_BY_KEY[key] ?? DAYPART_BY_KEY["미정"];
}

// "HH:mm" | null → "오전" | "오후" | "저녁" | "미정"
//   < 12:00 오전 / 12:00~18:00 오후 / >= 18:00 저녁 / 없음 미정 (스키마 §3 규칙)
export function daypartOf(time) {
  if (!time) return "미정";
  const hh = Number(String(time).slice(0, 2));
  if (Number.isNaN(hh)) return "미정";
  if (hh < 12) return "오전";
  if (hh < 18) return "오후";
  return "저녁";
}

// 소요시간(분) → 사람이 읽는 라벨. null/0 이하면 null(라벨 생략).
//   60 → "1시간", 90 → "1시간 30분", 30 → "30분"
export function formatDuration(min) {
  if (min === null || min === undefined) return null;
  const m = Number(min);
  if (Number.isNaN(m) || m <= 0) return null;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}분`;
  if (rest === 0) return `${h}시간`;
  return `${h}시간 ${rest}분`;
}

// 블록 오버라인(kicker) 텍스트: "10:00 · 1시간" | "10:00" | "시간 미정".
//   time 없으면 "시간 미정" / durationMin 없으면 시간만.
export function overlineOf({ time, durationMin } = {}) {
  if (!time) return "시간 미정";
  const dur = formatDuration(durationMin);
  return dur ? `${time} · ${dur}` : time;
}

// properties.region → 블록 우측 meta 텍스트(시안: .meta "부산 해운대구"). pill 아님.
export function regionOf(properties = {}) {
  const r = properties?.region;
  return r ? String(r) : null;
}

// properties.transport → 이동 회색 스트립 본문(시안: 🚄 ... 택시 15분).
export function transportOf(properties = {}) {
  const t = properties?.transport;
  return t ? String(t) : null;
}

// properties 객체 → 인라인 pill 목록 [{ key, emoji, text }] (시안 .pp).
// region 은 meta 텍스트로, transport 는 이동 스트립으로 따로 빠지므로 여기선 제외.
// 알려진 키는 전용 이모지/포맷, 그 외(예약번호 등)는 라벨 그대로(🔖).
// AI 추천 내부 메타 — 데이터엔 보존하되 사용자에겐 노출하지 않는다(점수·출처·유사도 등).
const HIDDEN_PROPERTY_KEYS = new Set([
  "source",
  "score",
  "similarity",
  "matchedCandidateId",
  "matchedCandidateName",
  "meal",
]);

export function propertyPills(properties = {}) {
  const pills = [];
  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined || value === "") continue;
    if (key === "region" || key === "transport") continue; // meta / 스트립으로 분리
    if (HIDDEN_PROPERTY_KEYS.has(key)) continue; // AI 내부 메타 — 비노출
    switch (key) {
      // ⚠ duration 문자열은 더 이상 properties 에 없음 — durationMin(오버라인) 이 정본.
      case "budget":
        pills.push({ key, emoji: "💰", text: formatBudget(value) });
        break;
      case "rating":
        pills.push({ key, emoji: "⭐", text: Number(value).toFixed(1) });
        break;
      case "memo":
        pills.push({ key, emoji: "📝", text: String(value) });
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
