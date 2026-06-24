import { describe, it, expect, vi, beforeEach } from 'vitest'

// 실제 백엔드(USE_MOCK=false) 분기: 올바른 /api/ai/* 경로와 바디로 호출하는지 검증.
vi.mock('@/services/config', () => ({
  USE_MOCK: false,
  mockDelay: vi.fn(async () => {}),
}))
const apiPost = vi.fn(async () => ({ ok: true }))
vi.mock('@/services/api', () => ({
  apiPost: (...args) => apiPost(...args),
}))

const { createTripCandidates, recommendTrip, createAiTripPlan } = await import('@/services/aiTrip')

describe('AI 여행 추천 서비스 (실제 API 분기)', () => {
  beforeEach(() => apiPost.mockClear())

  it('① 후보 생성 → POST /api/ai/trip-candidates', async () => {
    await createTripCandidates({ message: '부산 2박 3일', count: 8 })
    expect(apiPost).toHaveBeenCalledWith('/api/ai/trip-candidates', {
      message: '부산 2박 3일',
      count: 8,
    })
  })

  it('② 추천 → POST /api/ai/trip-recommendations (선택 후보·위치 전달)', async () => {
    await recommendTrip({
      sessionId: 's1',
      selectedCandidateIds: ['c1', 'c2'],
      latitude: 37.5,
      longitude: 127,
      radiusMeters: 50000,
      limit: 10,
    })
    expect(apiPost).toHaveBeenCalledWith(
      '/api/ai/trip-recommendations',
      expect.objectContaining({
        sessionId: 's1',
        selectedCandidateIds: ['c1', 'c2'],
        latitude: 37.5,
        longitude: 127,
      }),
    )
  })

  it('③ 여행 생성 → POST /api/ai/trip-plans (제목·기간·그룹·세션 전달)', async () => {
    await createAiTripPlan({
      title: '부모님과 전주',
      startDate: '2026-07-01',
      endDate: '2026-07-02',
      groupId: 10,
      sessionId: 's1',
      selectedCandidateIds: ['c1'],
    })
    expect(apiPost).toHaveBeenCalledWith(
      '/api/ai/trip-plans',
      expect.objectContaining({
        title: '부모님과 전주',
        startDate: '2026-07-01',
        endDate: '2026-07-02',
        groupId: 10,
        sessionId: 's1',
        selectedCandidateIds: ['c1'],
      }),
    )
  })
})
