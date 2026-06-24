import { describe, it, expect } from 'vitest'
import {
  buildTripMessage,
  createTripCandidates,
  recommendTrip,
  createAiTripPlan,
} from '@/services/aiTrip'
import * as db from '@/services/mock/db'

// USE_MOCK 기본값 = true(테스트 env 에 VITE_USE_MOCK 없음) → mock 분기를 그대로 검증.

describe('buildTripMessage — 폼 입력을 자연어로 합성', () => {
  it('지역·기간·인원·스타일을 한 문장으로 합친다', () => {
    const msg = buildTripMessage({
      regionLabel: '부산',
      nights: 2,
      days: 3,
      headcount: 4,
      styles: ['바다', '맛집'],
    })
    expect(msg).toContain('부산')
    expect(msg).toContain('2박 3일')
    expect(msg).toContain('4명')
    expect(msg).toContain('바다·맛집')
    expect(msg).toContain('추천')
  })

  it('자유서술(note)은 앞뒤 공백을 trim 해 뒤에 덧붙인다', () => {
    const msg = buildTripMessage({ regionLabel: '제주', note: '  조용한 곳 부탁해요  ' })
    expect(msg).toContain('조용한 곳 부탁해요')
    expect(msg).not.toContain('  조용한')
  })

  it('당일치기(nights 0)는 "당일"로 표기한다', () => {
    expect(buildTripMessage({ days: 1, nights: 0 })).toContain('당일')
  })

  it('입력이 비어도 기본 추천 문장을 만든다', () => {
    expect(buildTripMessage()).toContain('추천')
  })
})

describe('AI 여행 추천 서비스 (mock 분기)', () => {
  it('① 후보 생성은 sessionId 와 후보 목록을 돌려준다', async () => {
    const res = await createTripCandidates({ message: '부산 여행', count: 5 })
    expect(res.sessionId).toBeTruthy()
    expect(Array.isArray(res.candidates)).toBe(true)
    expect(res.candidates.length).toBe(5)
    const first = res.candidates[0]
    expect(first).toHaveProperty('candidateId')
    expect(first).toHaveProperty('name')
    expect(first).toHaveProperty('regionHint')
    // 내부 매칭용 _contentId 는 응답에서 노출되지 않는다.
    expect(first).not.toHaveProperty('_contentId')
  })

  it('② 추천은 선택한 후보만큼 실제 관광지를 돌려준다', async () => {
    const { sessionId, candidates } = await createTripCandidates({ message: 'x', count: 4 })
    const selected = [candidates[0].candidateId, candidates[2].candidateId]
    const res = await recommendTrip({ sessionId, selectedCandidateIds: selected })
    expect(res.recommendations.length).toBe(2)
    expect(res.recommendations[0]).toHaveProperty('contentId')
    expect(res.recommendations[0]).toHaveProperty('score')
    expect(res.recommendations[0].matchedCandidateId).toBe(candidates[0].candidateId)
  })

  it('③ 여행 생성은 추천을 trips.data.items 로 담은 TripDto 를 만든다', async () => {
    const { sessionId, candidates } = await createTripCandidates({ message: 'x', count: 3 })
    const selected = [candidates[0].candidateId]
    const trip = await createAiTripPlan({
      title: '테스트 여행',
      startDate: '2026-07-01',
      endDate: '2026-07-02',
      sessionId,
      selectedCandidateIds: selected,
    })
    expect(trip.tripId).toBeTruthy()
    expect(trip.title).toBe('테스트 여행')
    expect(trip.data.items.length).toBe(1)
    expect(trip.data.items[0].properties.source).toBe('AI_RECOMMENDATION')
    // 생성된 여행은 mock TRIPS 에 적재되어 S6 에디터가 읽을 수 있다.
    expect(db.TRIPS[trip.tripId]).toBeTruthy()
  })

  it('title 이 비면 기본 제목을 쓴다', async () => {
    const { sessionId, candidates } = await createTripCandidates({ message: 'x', count: 2 })
    const trip = await createAiTripPlan({
      startDate: '2026-07-01',
      endDate: '2026-07-01',
      sessionId,
      selectedCandidateIds: [candidates[0].candidateId],
    })
    expect(trip.title).toBe('AI 추천 여행 계획')
  })
})
