// 발자취 지도(S8)용 간단 시각화 좌표 — 실제 GeoJSON SDK 없이 17개 시도를
// 한국 지형을 닮은 그리드 셀로 배치한다. 방문 여부 색칠 + 핀 위치 계산에 쓴다.
// sidoCode 는 services/mock/db.js 의 SIDOS 와 일치(전국 17곳).
// viewBox 좌표계: 0~100 (x) × 0~140 (y). 셀은 둥근 사각형(권역 추상화).

export const SIDO_CELLS = [
  { sidoCode: 31, name: '경기', x: 40, y: 22, w: 24, h: 18 },
  { sidoCode: 1, name: '서울', x: 44, y: 26, w: 9, h: 7 },
  { sidoCode: 2, name: '인천', x: 33, y: 27, w: 9, h: 7 },
  { sidoCode: 32, name: '강원', x: 66, y: 16, w: 26, h: 22 },
  { sidoCode: 33, name: '충북', x: 50, y: 44, w: 20, h: 16 },
  { sidoCode: 34, name: '충남', x: 26, y: 46, w: 22, h: 16 },
  { sidoCode: 8, name: '세종', x: 44, y: 50, w: 8, h: 6 },
  { sidoCode: 3, name: '대전', x: 46, y: 58, w: 9, h: 7 },
  { sidoCode: 35, name: '경북', x: 64, y: 44, w: 26, h: 22 },
  { sidoCode: 4, name: '대구', x: 70, y: 62, w: 10, h: 8 },
  { sidoCode: 37, name: '전북', x: 30, y: 68, w: 24, h: 16 },
  { sidoCode: 36, name: '경남', x: 58, y: 72, w: 24, h: 18 },
  { sidoCode: 7, name: '울산', x: 84, y: 70, w: 10, h: 8 },
  { sidoCode: 6, name: '부산', x: 80, y: 84, w: 11, h: 8 },
  { sidoCode: 38, name: '전남', x: 28, y: 88, w: 26, h: 20 },
  { sidoCode: 5, name: '광주', x: 35, y: 84, w: 10, h: 7 },
  { sidoCode: 39, name: '제주', x: 34, y: 118, w: 18, h: 12 },
]

// sidoCode → 셀 중심점(핀 좌표).
export const SIDO_CENTER = Object.fromEntries(
  SIDO_CELLS.map((c) => [c.sidoCode, { x: c.x + c.w / 2, y: c.y + c.h / 2 }]),
)

// 미디어 타입 → 배지(이모지 + 라벨). 색만으로 구분하지 않도록 라벨 병행(§3.6).
export const MEDIA_BADGE = {
  PHOTO: { emoji: '📷', label: '사진' },
  VOICE: { emoji: '🎙️', label: '음성' },
  VIDEO: { emoji: '🎬', label: '영상' },
}

// 전국 시도 수(요약 카피 "전국 17곳 중 N곳").
export const TOTAL_SIDO = SIDO_CELLS.length
