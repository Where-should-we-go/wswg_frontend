import { describe, it, expect } from 'vitest'
import { packSchedule } from '@/features/trip/lib/calendar'

describe('packSchedule — 순차 재패킹(겹침 0)', () => {
  it('앵커부터 각 블록의 소요시간만큼 이어 붙인다', () => {
    const out = packSchedule(
      [
        { id: 'a', durationMin: 60 },
        { id: 'b', durationMin: 30 },
        { id: 'c', durationMin: 90 },
      ],
      { anchorMin: 9 * 60 },
    )
    expect(out).toEqual([
      { id: 'a', time: '09:00' },
      { id: 'b', time: '10:00' }, // a 끝(10:00)
      { id: 'c', time: '10:30' }, // b 끝(10:30)
    ])
  })

  it('durationMin 없으면 기본 간격(60분)을 쓴다', () => {
    const out = packSchedule([{ id: 'a' }, { id: 'b', durationMin: 0 }, { id: 'c' }], {
      anchorMin: 8 * 60,
      defaultDur: 60,
    })
    expect(out.map((o) => o.time)).toEqual(['08:00', '09:00', '10:00'])
  })

  it('앵커를 그대로 첫 블록 시작으로 쓴다(하루 시작 고정)', () => {
    const out = packSchedule(
      [
        { id: 'a', durationMin: 120 },
        { id: 'b', durationMin: 60 },
      ],
      {
        anchorMin: 13 * 60 + 30,
      },
    )
    expect(out).toEqual([
      { id: 'a', time: '13:30' },
      { id: 'b', time: '15:30' },
    ])
  })

  it('자정을 넘으면 23:59 로 클램프한다', () => {
    const out = packSchedule(
      [
        { id: 'a', durationMin: 60 },
        { id: 'b', durationMin: 60 },
      ],
      { anchorMin: 23 * 60 + 30 }, // 23:30 시작
    )
    expect(out[0].time).toBe('23:30')
    expect(out[1].time).toBe('23:59') // 24:30 → 클램프
  })

  it('빈 목록은 빈 결과', () => {
    expect(packSchedule([], { anchorMin: 540 })).toEqual([])
  })
})
