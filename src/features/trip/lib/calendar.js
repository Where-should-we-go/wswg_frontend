// 캘린더(시간 그리드) 뷰 전용 헬퍼 — 같은 data.items[] 를 시각 위치/높이로 변환한다.
// 일정(레일) 뷰는 blockMeta.js(daypart/overline) 를 쓰고, 여기선 캘린더 좌표 계산만.
// 스키마 §5: 캘린더는 top=time, height=durationMin, time:null 은 상단 "시간 미정" 트레이.
//
// 시안(artifact/schedule-calendar.html): 좌측 시간 눈금(09–21시) + visitDate 별 DAY 컬럼.
// 단 일정에 09 밖 시각(예 06:00/23:00)이 있으면 범위를 자동 확장해 잘리지 않게 한다.

import { typeKeyOf } from "@/features/trip/lib/blockMeta";

// 그리드 기본 범위(시안 09–21시)·렌더 상수.
export const DEFAULT_RANGE_START_HOUR = 9; // 09:00
export const DEFAULT_RANGE_END_HOUR = 21; // 21:00 (마지막 눈금)
export const PX_PER_HOUR = 46; // 시안 --hourPx:46px
export const MIN_EVENT_MIN = 30; // 최소 블록 높이(분) — 짧은 일정도 클릭 가능하게
export const DEFAULT_DURATION_MIN = 60; // durationMin 없을 때 기본 높이(스키마 §3)
export const MOVE_STRIP_PX = 18; // 이동 점선 스트립 고정 높이(시안 .move)

// "HH:mm" → 분(0~1439). null/형식오류면 null.
export function timeToMinutes(time) {
  if (!time) return null;
  const m = String(time).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

// 분 → "HH:mm" (시간 라벨용).
export function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 시각 있는 항목(이동 포함)을 보고 그리드의 [startHour, endHour] 를 산출.
// 기본 09–21 을 쓰되, 더 이른 시작/늦은 종료가 있으면 그 시각을 포함하도록 확장한다.
//   - 시작은 가장 이른 time 의 정시(내림), 종료는 가장 늦은 time+durationMin 의 정시(올림).
export function computeRange(items = []) {
  let minMin = DEFAULT_RANGE_START_HOUR * 60;
  let maxMin = DEFAULT_RANGE_END_HOUR * 60;
  for (const it of items) {
    const start = timeToMinutes(it.time);
    if (start === null) continue; // 미정 항목은 범위에 영향 없음
    const dur =
      it.durationMin != null && Number(it.durationMin) > 0
        ? Number(it.durationMin)
        : DEFAULT_DURATION_MIN;
    const end = start + dur;
    if (start < minMin) minMin = start;
    if (end > maxMin) maxMin = end;
  }
  const startHour = Math.floor(minMin / 60);
  const endHour = Math.ceil(maxMin / 60);
  return { startHour, endHour };
}

// 범위 → 시간 눈금 배열 [{ hour, label }] (시작~종료 정시, 종료 포함).
export function hourMarks({ startHour, endHour }) {
  const out = [];
  for (let h = startHour; h <= endHour; h++) {
    out.push({ hour: h, label: `${String(h).padStart(2, "0")}:00` });
  }
  return out;
}

// 범위 → 그리드 본문 전체 높이(px). 마지막 정시 줄까지 = (endHour-startHour) 칸.
export function gridHeightPx({ startHour, endHour }) {
  return (endHour - startHour) * PX_PER_HOUR;
}

// 블록 1개 → 캘린더 좌표. time 없으면 null(트레이로 분리).
//   top    = (start - rangeStart) * pxPerHour/60
//   height = max(durationMin, 최소높이) * pxPerHour/60   (이동은 고정 스트립 높이)
export function eventLayout(block, { startHour }) {
  const start = timeToMinutes(block.time);
  if (start === null) return null;
  const rangeStart = startHour * 60;
  const top = ((start - rangeStart) * PX_PER_HOUR) / 60;
  const isMove = block.type === "이동";
  if (isMove) {
    return { top, height: MOVE_STRIP_PX, startMin: start, isMove: true };
  }
  const rawDur =
    block.durationMin != null && Number(block.durationMin) > 0
      ? Number(block.durationMin)
      : DEFAULT_DURATION_MIN;
  const dur = Math.max(rawDur, MIN_EVENT_MIN);
  const height = (dur * PX_PER_HOUR) / 60;
  return { top, height, startMin: start, endMin: start + rawDur, isMove: false };
}

// 시각 라벨 "10:00 – 11:00" (durationMin 있을 때) | "19:00" (없을 때, 단발 시각).
export function eventTimeLabel(block) {
  const start = timeToMinutes(block.time);
  if (start === null) return "";
  const dur =
    block.durationMin != null && Number(block.durationMin) > 0
      ? Number(block.durationMin)
      : null;
  if (!dur) return minutesToTime(start);
  return `${minutesToTime(start)} – ${minutesToTime(start + dur)}`;
}

// 같은 DAY 컬럼 안에서 겹치는 시각 블록을 좌우로 나눈다(드물지만 대비).
// 단순 처리: 시작순 정렬 후 겹치면 같은 묶음(cluster)으로, 묶음 안 인덱스로 너비 분할.
//   반환: 각 layout 에 { cols, colIndex } 부여. 안 겹치면 cols=1.
// (캘린더 표준 lane 알고리즘의 단순화판 — 한 묶음 내 동시 최대 개수로 나눔.)
export function assignColumns(events) {
  const sorted = [...events].sort(
    (a, b) => a.layout.top - b.layout.top || a.layout.height - b.layout.height,
  );
  let cluster = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const cols = cluster.length;
    cluster.forEach((e, i) => {
      e.layout.cols = cols;
      e.layout.colIndex = i;
    });
    cluster = [];
  };

  for (const e of sorted) {
    const top = e.layout.top;
    const bottom = top + e.layout.height;
    if (cluster.length && top >= clusterEnd) flush();
    cluster.push(e);
    clusterEnd = Math.max(clusterEnd, bottom);
  }
  flush();
  return sorted;
}

// 한 DAY 컬럼의 블록들을 캘린더 렌더 모델로 변환.
//   - time 있는 항목 → events(layout 포함, 겹침 컬럼 배정). 이동은 isMove 플래그.
//   - time 없는 항목 → undated(트레이로). (이 함수는 day 단위라 트레이는 상위에서 합침)
export function buildDayEvents(blocks, range) {
  const events = [];
  const undated = [];
  for (const b of blocks) {
    const layout = eventLayout(b, range);
    if (layout === null) {
      undated.push(b);
      continue;
    }
    events.push({ block: b, layout, typeKey: typeKeyOf(b.type) });
  }
  assignColumns(events);
  return { events, undated };
}
