import { describe, it, expect, vi, beforeEach } from 'vitest'

// 실제 백엔드(USE_MOCK=false) 분기: 올바른 경로/바디로 호출하는지 검증.
vi.mock('@/services/config', () => ({
  USE_MOCK: false,
  mockDelay: vi.fn(async () => {}),
  toQuery: () => '',
}))
const apiPost = vi.fn(async () => ({ tripId: 42 }))
vi.mock('@/services/api', () => ({
  apiPost: (...args) => apiPost(...args),
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  apiUpload: vi.fn(),
}))

const {
  createTripCandidates,
  recommendTrip,
  recommendRestaurants,
  createTripFromItinerary,
  insertMoveBlocks,
} = await import('@/services/aiTrip')

describe('AI 추천 서비스 (실제 API 분기)', () => {
  beforeEach(() => apiPost.mockClear())

  it('후보 생성 → POST /api/ai/trip-candidates', async () => {
    await createTripCandidates({ message: '제주 2박 3일', count: 8 })
    expect(apiPost).toHaveBeenCalledWith('/api/ai/trip-candidates', {
      message: '제주 2박 3일',
      count: 8,
    })
  })

  it('추천 → POST /api/ai/trip-recommendations (contentTypeId 전달)', async () => {
    await recommendTrip({ sessionId: 's1', selectedCandidateIds: ['c1'], contentTypeId: 39, limit: 6 })
    expect(apiPost).toHaveBeenCalledWith(
      '/api/ai/trip-recommendations',
      expect.objectContaining({ sessionId: 's1', selectedCandidateIds: ['c1'], contentTypeId: 39 }),
    )
  })

  it('식당 추천 → 일수×2(상한 30) limit 으로 음식점만 요청', async () => {
    await recommendRestaurants({ sessionId: 's1', selectedCandidateIds: ['c1', 'c2'], days: 3 })
    const [, body] = apiPost.mock.calls[0]
    expect(body.contentTypeId).toBe(39)
    expect(body.limit).toBe(6) // 3일 × 2끼(점심·저녁)
  })

  it('AI 후보 호출은 일시적 실패 시 재시도한다', async () => {
    apiPost
      .mockRejectedValueOnce(new Error('AI 여행 후보 생성에 실패했습니다.'))
      .mockResolvedValueOnce({ sessionId: 's', candidates: [] })
    const res = await createTripCandidates({ message: 'x', count: 4 })
    expect(apiPost).toHaveBeenCalledTimes(2) // 1회 실패 후 재시도 성공
    expect(res.sessionId).toBe('s')
  })

  it('여행 생성 → POST /api/trips (조립한 data.items 그대로 저장)', async () => {
    const items = [{ id: 'ai-1', contentId: 1, title: 'A', type: '관광', order: 1 }]
    await createTripFromItinerary({
      title: '제주 2박 3일',
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      groupId: 10,
      items,
      region: '제주특별자치도',
      styles: ['바다', '맛집'],
    })
    expect(apiPost).toHaveBeenCalledWith(
      '/api/trips',
      expect.objectContaining({
        title: '제주 2박 3일',
        startDate: '2026-07-01',
        endDate: '2026-07-03',
        groupId: 10,
        // 지역·스타일이 data.meta 에 보존돼 속성 패널에 반영된다.
        data: expect.objectContaining({
          items,
          meta: expect.objectContaining({ region: '제주특별자치도', styles: ['바다', '맛집'] }),
        }),
      }),
    )
  })

  describe('insertMoveBlocks — 같은 날 연속 장소 사이 이동 블록', () => {
    const place = (id, title, date, lat, lng, time = null) => ({
      id,
      title,
      type: '관광',
      visitDate: date,
      lat,
      lng,
      time,
      order: 1,
    })

    it('같은 날 인접 장소쌍만 /api/ai/travel-legs 로 요청하고 이동 블록을 끼운다', async () => {
      apiPost.mockResolvedValueOnce([
        { available: true, mode: 'CAR', distanceMeters: 12300, durationSeconds: 1140 },
      ])
      const items = [
        place('ai-1', '한림공원', '2026-07-01', 33.38, 126.24),
        place('ai-2', '금산공원', '2026-07-01', 33.45, 126.49),
        place('ai-3', '성산', '2026-07-02', 33.45, 126.93), // 다른 날 → leg 없음
      ]

      const result = await insertMoveBlocks(items, 'CAR')

      // 1구간만 요청(같은 날 인접쌍 1개)
      const [path, body] = apiPost.mock.calls[0]
      expect(path).toBe('/api/ai/travel-legs')
      expect(body.travelMode).toBe('CAR')
      expect(body.legs).toHaveLength(1)

      // 한림공원 다음에 이동 블록 삽입
      expect(result).toHaveLength(4)
      const move = result[1]
      expect(move.type).toBe('이동')
      expect(move.title).toBe('한림공원 → 금산공원')
      expect(move.properties.transport).toBe('자동차 · 12.3km · 19분')
    })

    it('이동 계산이 실패해도 일정은 그대로 반환한다', async () => {
      apiPost.mockRejectedValueOnce(new Error('boom'))
      const items = [
        place('ai-1', 'A', '2026-07-01', 33.1, 126.1),
        place('ai-2', 'B', '2026-07-01', 33.2, 126.2),
      ]
      const result = await insertMoveBlocks(items, 'TRANSIT')
      expect(result).toBe(items)
    })

    it('available=false 구간은 이동 블록을 만들지 않는다', async () => {
      apiPost.mockResolvedValueOnce([{ available: false, mode: 'TRANSIT' }])
      const items = [
        place('ai-1', 'A', '2026-07-01', 33.1, 126.1),
        place('ai-2', 'B', '2026-07-01', 33.2, 126.2),
      ]
      const result = await insertMoveBlocks(items, 'TRANSIT')
      expect(result).toHaveLength(2)
      expect(result.some((b) => b.type === '이동')).toBe(false)
    })
  })
})
