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

  it('contentTypeId=음식점 으로 식당만 추천받는다(일수×2)', async () => {
    const { sessionId, candidates } = await createTripCandidates({ message: 'x', count: 4 })
    const ids = candidates.map((c) => c.candidateId)
    const restaurants = await recommendRestaurants({
      sessionId,
      selectedCandidateIds: ids,
      days: 2,
    })
    // 일수(2)×2 = 4 끼니(점심·저녁) 만큼 요청.
    expect(restaurants.length).toBeLessThanOrEqual(4)
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

  it('관광지·식당을 한 동선으로 묶어 거리상 가까운 순으로 배치한다(식당 포함)', () => {
    // 관광 3곳을 잇는 직선 위에 식당 2곳이 사이사이에 위치 → 동선상 식당이 끼어들어야 한다.
    const items = buildItinerary({
      attractions: [
        { contentId: 1, title: '관광A', contentTypeId: 12, latitude: 33.0, longitude: 126.0 },
        { contentId: 2, title: '관광B', contentTypeId: 12, latitude: 33.2, longitude: 126.2 },
        { contentId: 3, title: '관광C', contentTypeId: 12, latitude: 33.4, longitude: 126.4 },
      ],
      restaurants: [
        { contentId: 101, title: '식당1', contentTypeId: RESTAURANT_CONTENT_TYPE_ID, latitude: 33.1, longitude: 126.1 },
        { contentId: 102, title: '식당2', contentTypeId: RESTAURANT_CONTENT_TYPE_ID, latitude: 33.3, longitude: 126.3 },
      ],
      startDate: '2026-07-01',
      endDate: '2026-07-01', // 1일
    })
    // 동선: 관광A → 식당1 → 관광B → 식당2 → 관광C (식당이 거리순으로 사이에 배치된다)
    expect(items.map((it) => it.title)).toEqual(['관광A', '식당1', '관광B', '식당2', '관광C'])
    expect(items.map((it) => it.type)).toEqual(['관광', '식당', '관광', '식당', '관광'])
    // 시간은 동선 순서대로 증가한다(점심·저녁 라벨은 식당 등장 순서).
    expect(items.map((it) => it.time)).toEqual(['09:00', '11:30', '13:00', '15:30', '17:00'])
    expect(items.map((it) => it.durationMin)).toEqual([120, 60, 120, 60, 120])
    expect(items.map((it) => it.order)).toEqual([1, 2, 3, 4, 5])
    const meals = items.filter((it) => it.type === '식당')
    expect(meals.map((m) => m.properties.meal)).toEqual(['점심', '저녁'])
    expect(items.every((it) => it.properties.source === 'AI_RECOMMENDATION')).toBe(true)
  })

  it('여러 날이면 식당은 하루 2끼(점심·저녁)씩, 관광지는 날짜에 분배된다', () => {
    const items = buildItinerary({
      attractions, // 3
      restaurants, // 6
      startDate: '2026-07-01',
      endDate: '2026-07-02', // 2일
    })
    expect(items.filter((it) => it.type === '식당').length).toBe(4) // 2일 × 2끼
    expect(items.filter((it) => it.type === '관광').length).toBe(3)
    expect(new Set(items.map((it) => it.visitDate))).toEqual(
      new Set(['2026-07-01', '2026-07-02']),
    )
  })

  it('하루 관광 슬롯(3)을 넘는 선택은 시간 없이 뒤에 붙인다(캘린더 배치용)', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ contentId: i + 1, title: `관광${i}`, contentTypeId: 12 }))
    const items = buildItinerary({
      attractions: many,
      restaurants: restaurants.slice(0, 2),
      startDate: '2026-07-01',
      endDate: '2026-07-01', // 1일 → 관광 5개 중 3개만 시간 슬롯
    })
    const timed = items.filter((it) => it.type === '관광' && it.time)
    const untimed = items.filter((it) => it.type === '관광' && !it.time)
    expect(timed.length).toBe(3)
    expect(untimed.length).toBe(2)
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
