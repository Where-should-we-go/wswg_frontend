import { describe, it, expect } from 'vitest'
import { dateRange } from '@/features/trip/lib/useTripEditor'

// 회귀: 로컬 자정 파싱 후 toISOString(UTC)로 포맷하면 KST 등에서 하루 밀려
// Day1 이 시작일 전날로 잡혔다. 로컬 기준 포맷으로 시작일이 그대로 Day1 이어야 한다.
describe('dateRange — 일자 범위(타임존 off-by-one 방지)', () => {
  it('시작일이 그대로 첫 날이다', () => {
    expect(dateRange('2026-07-01', '2026-07-03')).toEqual([
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
    ])
  })

  it('당일치기는 그 하루만', () => {
    expect(dateRange('2026-07-01', '2026-07-01')).toEqual(['2026-07-01'])
  })

  it('한쪽이 없으면 빈 배열', () => {
    expect(dateRange('', '2026-07-01')).toEqual([])
    expect(dateRange('2026-07-01', '')).toEqual([])
  })
})
