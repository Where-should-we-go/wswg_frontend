import { describe, it, expect } from 'vitest'
import { useTripEditor } from '@/features/trip/lib/useTripEditor'

// USE_MOCK 기본값 = true → 실시간(WS) 비활성, setDates 의 로컬 재배치 로직만 검증.
function tripWith(items, start, end) {
  return {
    trip_id: 999,
    title: '여행',
    start_date: start,
    end_date: end,
    user_id: 1,
    group_id: null,
    members: [],
    presence: [],
    data: { items },
  }
}

describe('useTripEditor.setDates — 기간 변경 시 일자 재배치', () => {
  it('일자가 늘면 기존 항목의 visitDate 는 유지되고 빈 Day 가 생긴다', () => {
    const ed = useTripEditor(
      tripWith(
        [
          { id: 'b1', visitDate: '2026-07-01', order: 1 },
          { id: 'b2', visitDate: '2026-07-02', order: 1 },
        ],
        '2026-07-01',
        '2026-07-02',
      ),
    )

    ed.setDates('2026-07-01', '2026-07-04') // 2일 → 4일

    expect(ed.days.value.length).toBe(4)
    expect(ed.items.value.find((i) => i.id === 'b1').visitDate).toBe('2026-07-01')
    expect(ed.items.value.find((i) => i.id === 'b2').visitDate).toBe('2026-07-02')
    // 늘어난 날(7/3·7/4)은 빈 칸이어야 한다.
    expect(ed.days.value.find((d) => d.date === '2026-07-04').blocks).toHaveLength(0)
  })

  it('일자가 줄면 사라진 날의 항목이 남은 날짜로 분산되고, 삭제되지는 않는다', () => {
    const ed = useTripEditor(
      tripWith(
        [
          { id: 'b1', visitDate: '2026-07-01', order: 1 },
          { id: 'b2', visitDate: '2026-07-03', order: 1 }, // 사라지는 날
          { id: 'b3', visitDate: '2026-07-04', order: 1 }, // 사라지는 날
        ],
        '2026-07-01',
        '2026-07-04',
      ),
    )

    ed.setDates('2026-07-01', '2026-07-02') // 4일 → 2일

    const valid = new Set(['2026-07-01', '2026-07-02'])
    // 모든 항목이 남은 범위 안으로 재배치된다(범위 밖에 남는 항목 없음).
    expect(ed.items.value.every((i) => valid.has(i.visitDate))).toBe(true)
    // 항목은 보존(삭제 X) — 사용자가 직접 정리하도록.
    expect(ed.items.value).toHaveLength(3)
    // 살아있는 날(7/1)의 항목은 그대로 유지.
    expect(ed.items.value.find((i) => i.id === 'b1').visitDate).toBe('2026-07-01')
  })

  it('시작일이 종료일보다 늦으면 무시한다', () => {
    const ed = useTripEditor(tripWith([], '2026-07-01', '2026-07-03'))
    ed.setDates('2026-07-05', '2026-07-03') // 역전 → 무시
    expect(ed.trip.value.start_date).toBe('2026-07-01')
    expect(ed.trip.value.end_date).toBe('2026-07-03')
  })
})
