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

const { createTripCandidates, recommendTrip, recommendRestaurants, createTripFromItinerary } =
  await import('@/services/aiTrip')

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
    })
    expect(apiPost).toHaveBeenCalledWith(
      '/api/trips',
      expect.objectContaining({
        title: '제주 2박 3일',
        startDate: '2026-07-01',
        endDate: '2026-07-03',
        groupId: 10,
        data: expect.objectContaining({ items }),
      }),
    )
  })
})
