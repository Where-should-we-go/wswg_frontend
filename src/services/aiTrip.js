// AI 추천 기반 여행 생성 도메인 (backend #56 — /api/ai/*, 일반 /api/trips 조립).
//
// 흐름(2단계 UX):
//   ① 폼 → createTripCandidates(자동) → 후보 전체 자동선택 → recommendTrip 로 실제 관광지 추천
//   ② 사용자가 추천 관광지를 다중선택 → 여행 만들기:
//        recommendTrip(contentTypeId=음식점, limit=일수×3)로 식당 확보
//        → buildItinerary 로 일자별 일정 조립(끼니 3 + 관광)
//        → createTripFromItinerary 가 POST /api/trips (data.items) 로 저장
//
// trip-plans 는 선택한 실제 관광지를 직접 못 받고(서버가 candidate 로 재계산) 끼니 주입도 못 해서,
// 사용자의 선택을 그대로 살리려고 일반 trip 생성 API 로 조립한다.
import { apiPost } from './api'
import { USE_MOCK, mockDelay } from './config'
import { createTrip } from './trips'
import * as db from './mock/db'

// TourAPI 콘텐츠 타입: 음식점 = 39.
export const RESTAURANT_CONTENT_TYPE_ID = 39
// trip-recommendations limit 상한(백엔드 MAX_LIMIT).
const MAX_LIMIT = 30

// 폼 입력(지역·기간·인원·스타일·자유서술)을 자연어 한 문장으로 합성 → 후보 생성 message.
// 자유서술(note)이 있으면 뒤에 그대로 덧붙인다(사용자 의도 우선).
export function buildTripMessage({
  regionLabel = '',
  nights = 0,
  days = 0,
  headcount = 0,
  styles = [],
  note = '',
} = {}) {
  const parts = []
  if (regionLabel) parts.push(regionLabel)
  if (days > 0) parts.push(nights > 0 ? `${nights}박 ${days}일` : '당일')
  if (headcount > 0) parts.push(`${headcount}명`)
  if (styles.length > 0) parts.push(`${styles.join('·')} 위주`)
  let message = parts.length > 0 ? `${parts.join(' ')} 여행지를 추천해줘.` : '여행지를 추천해줘.'
  const trimmed = (note ?? '').trim()
  if (trimmed) message += ` ${trimmed}`
  return message
}

// ① 후보 생성. POST /api/ai/trip-candidates
// 반환: { sessionId, reply, candidates[{candidateId,name,regionHint,description,reason}], nextQuestion }
export async function createTripCandidates({ message, count = 8 }) {
  if (USE_MOCK) {
    await mockDelay(1200) // "후보를 고르고 있어요…" 체감용.
    return db.makeAiCandidates(message, count)
  }
  return apiPost('/api/ai/trip-candidates', { message, count })
}

// ② 선택 후보 기반 추천. POST /api/ai/trip-recommendations
// contentTypeId 를 주면 해당 타입(예: 음식점 39)만 추천. 위치(lat/lng)는 선택.
// 반환: { sessionId, reply, recommendations[{contentId,title,contentTypeId,sidoName,...,similarity,score}], nextQuestion }
export async function recommendTrip({
  sessionId,
  selectedCandidateIds,
  contentTypeId,
  latitude,
  longitude,
  radiusMeters,
  limit = 10,
}) {
  if (USE_MOCK) {
    await mockDelay(900)
    return db.makeAiRecommendations(sessionId, selectedCandidateIds, limit, contentTypeId)
  }
  return apiPost('/api/ai/trip-recommendations', {
    sessionId,
    selectedCandidateIds,
    contentTypeId,
    latitude,
    longitude,
    radiusMeters,
    limit,
  })
}

// startDate~endDate(포함) "YYYY-MM-DD" 배열. 한 쪽만 있으면 그 하루.
export function dayList(startDate, endDate) {
  if (!startDate) return endDate ? [endDate] : []
  if (!endDate) return [startDate]
  const out = []
  const cur = new Date(startDate)
  const end = new Date(endDate)
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// 추천 1건(관광지/식당)을 trips.data.items 블록으로 변환.
function toItem(rec, { type, date, meal }) {
  return {
    id: '',
    content_id: rec.contentId,
    contentId: rec.contentId,
    title: rec.title,
    type,
    contentTypeId: rec.contentTypeId ?? null,
    sidoCode: rec.sidoCode ?? null,
    sidoName: rec.sidoName ?? null,
    gugunCode: rec.gugunCode ?? null,
    gugunName: rec.gugunName ?? null,
    lat: rec.latitude ?? null,
    lng: rec.longitude ?? null,
    visitDate: date,
    media: [],
    properties: {
      source: 'AI_RECOMMENDATION',
      similarity: rec.similarity,
      score: rec.score,
      region: rec.sidoName ? `${rec.sidoName} ${rec.gugunName ?? ''}`.trim() : undefined,
      meal, // 아침/점심/저녁 (식당만)
    },
  }
}

// 선택 관광지 + 식당으로 일자별 일정을 조립한다.
// 하루 = 아침 → 관광 절반 → 점심 → 관광 나머지 → 저녁. 식당은 일자당 최대 3끼.
// 관광지는 일자 수만큼 라운드로빈으로 분배한다.
export function buildItinerary({ attractions = [], restaurants = [], startDate, endDate }) {
  const days = dayList(startDate, endDate)
  if (days.length === 0) return []

  // 관광지를 일자별 버킷으로 분배.
  const buckets = days.map(() => [])
  attractions.forEach((a, i) => buckets[i % days.length].push(a))

  const meals = ['아침', '점심', '저녁']
  const items = []
  let seq = 0
  days.forEach((date, di) => {
    const dayMeals = restaurants.slice(di * 3, di * 3 + 3)
    const dayAttr = buckets[di]
    const half = Math.ceil(dayAttr.length / 2)
    const seqForDay = []
    if (dayMeals[0]) seqForDay.push(toItem(dayMeals[0], { type: '식당', date, meal: meals[0] }))
    dayAttr.slice(0, half).forEach((a) => seqForDay.push(toItem(a, { type: '관광', date })))
    if (dayMeals[1]) seqForDay.push(toItem(dayMeals[1], { type: '식당', date, meal: meals[1] }))
    dayAttr.slice(half).forEach((a) => seqForDay.push(toItem(a, { type: '관광', date })))
    if (dayMeals[2]) seqForDay.push(toItem(dayMeals[2], { type: '식당', date, meal: meals[2] }))
    seqForDay.forEach((it, i) => {
      it.id = `ai-${++seq}`
      it.order = i + 1
      items.push(it)
    })
  })
  return items
}

// 세션의 후보 전체로 식당을 추천받는다. 일수×3 끼니만큼(상한 30) 확보.
export async function recommendRestaurants({ sessionId, selectedCandidateIds, days }) {
  const limit = Math.min(MAX_LIMIT, Math.max(1, days * 3))
  const res = await recommendTrip({
    sessionId,
    selectedCandidateIds,
    contentTypeId: RESTAURANT_CONTENT_TYPE_ID,
    limit,
  })
  return res?.recommendations ?? []
}

// ③ 조립한 일정으로 여행 생성. 일반 POST /api/trips (data.items) 로 사용자가 고른 장소를 그대로 저장.
// 반환: TripDto(camelCase) — 화면은 tripId 로 /trips/{tripId} 이동.
export async function createTripFromItinerary({ title, startDate, endDate, groupId, items }) {
  const data = { items, meta: { icon: '✨' }, aiRecommendation: { createdAt: null } }
  return createTrip({ title, startDate, endDate, groupId, data })
}
