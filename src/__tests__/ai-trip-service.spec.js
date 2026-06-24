import { describe, it, expect } from 'vitest'
import {
  buildTripMessage,
  createTripCandidates,
  recommendTrip,
  recommendRestaurants,
  buildItinerary,
  createTripFromItinerary,
  dayList,
  RESTAURANT_CONTENT_TYPE_ID,
} from '@/services/aiTrip'
import * as db from '@/services/mock/db'

// USE_MOCK 기본값 = true(테스트 env 에 VITE_USE_MOCK 없음) → mock 분기를 그대로 검증.

describe('buildTripMessage — 폼 입력을 자연어로 합성', () => {
  it('지역·기간·인원·스타일을 한 문장으로 합친다', () => {
    const msg = buildTripMessage({
      regionLabel: '제주',
      nights: 2,
      days: 3,
      headcount: 4,
      styles: ['바다', '맛집'],
    })
    expect(msg).toContain('제주')
    expect(msg).toContain('2박 3일')
    expect(msg).toContain('4명')
    expect(msg).toContain('바다·맛집')
    expect(msg).toContain('추천')
  })

  it('자유서술(note)은 trim 해 뒤에 덧붙인다', () => {
    const msg = buildTripMessage({ regionLabel: '제주', note: '  조용한 곳 부탁해요  ' })
    expect(msg).toContain('조용한 곳 부탁해요')
    expect(msg).not.toContain('  조용한')
  })
})

describe('dayList — 기간 → 날짜 배열', () => {
  it('시작~종료(포함) 날짜를 만든다', () => {
    expect(dayList('2026-07-01', '2026-07-03')).toEqual(['2026-07-01', '2026-07-02', '2026-07-03'])
  })
  it('한 쪽만 있으면 하루', () => {
    expect(dayList('2026-07-01', '')).toEqual(['2026-07-01'])
  })
})

describe('AI 추천 서비스 (mock 분기)', () => {
  it('후보 생성은 sessionId 와 후보 목록을 준다', async () => {
    const res = await createTripCandidates({ message: '제주 여행', count: 5 })
    expect(res.sessionId).toBeTruthy()
    expect(res.candidates.length).toBe(5)
    expect(res.candidates[0]).not.toHaveProperty('_contentId')
  })

  it('추천은 좌표·지역·타입을 포함한 실제 관광지를 준다(일정 조립에 필요)', async () => {
    const { sessionId, candidates } = await createTripCandidates({ message: 'x', count: 4 })
    const ids = candidates.map((c) => c.candidateId)
    const res = await recommendTrip({ sessionId, selectedCandidateIds: ids })
    const r = res.recommendations[0]
    expect(r).toHaveProperty('contentId')
    expect(r).toHaveProperty('contentTypeId')
    expect(r).toHaveProperty('sidoName')
    expect(r).toHaveProperty('latitude')
    expect(r).toHaveProperty('longitude')
  })

  it('contentTypeId=음식점 으로 식당만 추천받는다', async () => {
    const { sessionId, candidates } = await createTripCandidates({ message: 'x', count: 4 })
    const ids = candidates.map((c) => c.candidateId)
    const restaurants = await recommendRestaurants({
      sessionId,
      selectedCandidateIds: ids,
      days: 2,
    })
    // 일수(2)×3 = 6 끼니 만큼 요청.
    expect(restaurants.length).toBeLessThanOrEqual(6)
    expect(restaurants.length).toBeGreaterThan(0)
  })
})

describe('buildItinerary — 일정 조립(끼니 자동)', () => {
  const attractions = [
    { contentId: 1, title: '관광A', contentTypeId: 12, sidoName: '제주', latitude: 33.1, longitude: 126.1 },
    { contentId: 2, title: '관광B', contentTypeId: 12, sidoName: '제주', latitude: 33.2, longitude: 126.2 },
    { contentId: 3, title: '관광C', contentTypeId: 12, sidoName: '제주', latitude: 33.3, longitude: 126.3 },
  ]
  const restaurants = Array.from({ length: 6 }, (_, i) => ({
    contentId: 100 + i,
    title: `식당${i + 1}`,
    contentTypeId: RESTAURANT_CONTENT_TYPE_ID,
    sidoName: '제주',
    latitude: 33,
    longitude: 126,
  }))

  it('일자별로 식당 3끼와 관광지를 배치한다', () => {
    const items = buildItinerary({
      attractions,
      restaurants,
      startDate: '2026-07-01',
      endDate: '2026-07-02', // 2일
    })
    const meals = items.filter((it) => it.type === '식당')
    const sights = items.filter((it) => it.type === '관광')
    expect(meals.length).toBe(6) // 2일 × 3끼
    expect(sights.length).toBe(3) // 선택 관광 전부
    // 날짜는 두 날에 걸쳐 있고, 각 아이템에 source 태그가 붙는다.
    const dates = new Set(items.map((it) => it.visitDate))
    expect(dates).toEqual(new Set(['2026-07-01', '2026-07-02']))
    expect(items.every((it) => it.properties.source === 'AI_RECOMMENDATION')).toBe(true)
    // 끼니엔 meal 라벨(아침/점심/저녁)이 있다.
    expect(meals.every((m) => ['아침', '점심', '저녁'].includes(m.properties.meal))).toBe(true)
  })

  it('기간이 없으면 빈 배열', () => {
    expect(buildItinerary({ attractions, restaurants, startDate: '', endDate: '' })).toEqual([])
  })
})

describe('createTripFromItinerary (mock) — 조립 일정으로 여행 생성', () => {
  it('items 를 담은 trip 을 만들고 TRIPS 에 적재한다', async () => {
    const items = buildItinerary({
      attractions: [{ contentId: 1, title: 'A', contentTypeId: 12 }],
      restaurants: [],
      startDate: '2026-07-01',
      endDate: '2026-07-01',
    })
    const trip = await createTripFromItinerary({
      title: '제주 1일',
      startDate: '2026-07-01',
      endDate: '2026-07-01',
      items,
    })
    expect(trip.tripId).toBeTruthy()
    const saved = db.TRIPS[trip.tripId]
    expect(saved).toBeTruthy()
    expect(saved.data.items.length).toBe(1)
  })
})
