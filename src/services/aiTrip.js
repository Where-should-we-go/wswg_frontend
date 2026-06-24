// AI 후보 선택 기반 여행 추천 도메인 (backend #56 — /api/ai/*).
// 3단계: ① 자연어 → 후보 생성  ② 선택 후보 → 실제 관광지 추천  ③ 추천 → 여행 생성.
// 세 엔드포인트 모두 로그인 필요(authFetch). 화면(PlanNewView)은 USE_MOCK 여부와 무관하게 동일.
import { apiPost } from './api'
import { USE_MOCK, mockDelay } from './config'
import * as db from './mock/db'

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
// 반환: { sessionId, reply, recommendations[{contentId,title,similarity,distanceMeters,score,...}], nextQuestion }
export async function recommendTrip({
  sessionId,
  selectedCandidateIds,
  latitude,
  longitude,
  radiusMeters,
  limit = 10,
}) {
  if (USE_MOCK) {
    await mockDelay(900)
    return db.makeAiRecommendations(sessionId, selectedCandidateIds, limit)
  }
  return apiPost('/api/ai/trip-recommendations', {
    sessionId,
    selectedCandidateIds,
    latitude,
    longitude,
    radiusMeters,
    limit,
  })
}

// ③ 추천 기반 여행 생성. POST /api/ai/trip-plans
// 백엔드는 프론트가 내려준 장소를 믿지 않고 선택 후보로 추천을 재계산해 trips.data.items 에 저장한다.
// 반환: TripDto(camelCase) — 화면은 tripId 로 /trips/{tripId} 이동.
export async function createAiTripPlan({
  title,
  startDate,
  endDate,
  groupId,
  sessionId,
  selectedCandidateIds,
  latitude,
  longitude,
  radiusMeters,
  limit,
}) {
  if (USE_MOCK) {
    await mockDelay(1400)
    return db.makeAiTripPlan({
      title,
      startDate,
      endDate,
      groupId,
      sessionId,
      selectedCandidateIds,
      limit,
    })
  }
  return apiPost('/api/ai/trip-plans', {
    title,
    startDate,
    endDate,
    groupId,
    sessionId,
    selectedCandidateIds,
    latitude,
    longitude,
    radiusMeters,
    limit,
  })
}
