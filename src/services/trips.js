// 여행 문서 도메인 (S5 자동생성 · S6 편집 · S4 추가 · S7 카드).
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './api'
import { USE_MOCK, mockDelay, toQuery } from './config'
import * as db from './mock/db'

let mockTripSeq = 100

// ── 조회 (S6) ────────────────────────────────────────────────
export async function getTrip(tripId) {
  if (USE_MOCK) {
    await mockDelay()
    const trip = db.TRIPS[tripId]
    if (!trip) {
      const err = new Error('이 여행은 모임 멤버만 볼 수 있어요')
      err.status = 404
      throw err
    }
    // 깊은 복사로 반환(외부 변이 방지). 저장은 updateTrip 으로만.
    return structuredClone(trip)
  }
  return apiGet(`/api/trips/${tripId}`)
}

// ── 전체 갱신 (S6 PUT, S4 추가) ──────────────────────────────
// body: { title, startDate, endDate, data }
export async function updateTrip(tripId, body) {
  if (USE_MOCK) {
    await mockDelay(200)
    const prev = db.TRIPS[tripId] ?? {}
    db.TRIPS[tripId] = {
      ...prev,
      trip_id: Number(tripId),
      title: body.title ?? prev.title,
      start_date: body.startDate ?? prev.start_date,
      end_date: body.endDate ?? prev.end_date,
      data: body.data ?? prev.data,
    }
    return structuredClone(db.TRIPS[tripId])
  }
  return apiPut(`/api/trips/${tripId}`, body)
}

// ── 삭제 (D6) ────────────────────────────────────────────────
export async function deleteTrip(tripId) {
  if (USE_MOCK) {
    await mockDelay()
    delete db.TRIPS[tripId]
    return null
  }
  return apiDelete(`/api/trips/${tripId}`)
}

// ── 수동 생성 (D1, 빈 문서) ──────────────────────────────────
// body: { title, startDate, endDate, groupId? }
export async function createTrip(body) {
  if (USE_MOCK) {
    await mockDelay()
    const tripId = ++mockTripSeq
    db.TRIPS[tripId] = {
      trip_id: tripId,
      title: body.title ?? '새 여행',
      group_id: body.groupId ?? null,
      user_id: db.CURRENT_USER.id,
      start_date: body.startDate ?? null,
      end_date: body.endDate ?? null,
      cover: null,
      icon: '🗺️',
      region: null,
      budgetLabel: '',
      styles: [],
      members: [{ id: 'u1', name: '태호', initial: '태', color: 'var(--collab-1)' }],
      presence: [],
      data: { items: [] },
    }
    return { tripId }
  }
  return apiPost('/api/trips', body)
}

// ── 자동 생성 (S5, D2) ───────────────────────────────────────
// body: { sidoCode, gugunCode?, startDate, endDate, headcount, styles[], groupId? }
// 반환: { tripId, partial }
export async function autoGeneratePlan(body) {
  if (USE_MOCK) {
    await mockDelay(1600) // "일정을 짜고 있어요…" 체감용
    const sido = db.SIDOS.find((s) => s.sidoCode === Number(body.sidoCode))
    const pool = db.ATTRACTIONS.filter((a) => a.sidoCode === Number(body.sidoCode))
    const days = dayList(body.startDate, body.endDate)
    const items = []
    let idSeq = 0
    days.forEach((date) => {
      const slots = ['10:00', '13:00', '16:00']
      slots.forEach((time, i) => {
        const place = pool[(idSeq + i) % Math.max(pool.length, 1)]
        if (!place) return
        items.push({
          id: `g-${++idSeq}`,
          content_id: place.contentId,
          title: place.title,
          type: place.contentTypeId === 39 ? '식당' : '관광',
          lat: place.mapY,
          lng: place.mapX,
          visitDate: date,
          time,
          durationMin: 90,
          order: i + 1,
          media: [],
          properties: { region: `${place.sidoName} ${place.gugunName}` },
        })
      })
    })
    const tripId = ++mockTripSeq
    db.TRIPS[tripId] = {
      trip_id: tripId,
      title: `${sido?.sidoName ?? ''} ${days.length - 1}박 ${days.length}일`,
      group_id: body.groupId ?? null,
      user_id: db.CURRENT_USER.id,
      start_date: body.startDate,
      end_date: body.endDate,
      cover: null,
      icon: '✨',
      region: { label: sido?.sidoName ?? '', sido_code: Number(body.sidoCode) },
      budgetLabel: '',
      styles: body.styles ?? [],
      members: [{ id: 'u1', name: '태호', initial: '태', color: 'var(--collab-1)' }],
      presence: [],
      data: { items },
    }
    return { tripId, partial: pool.length < 3 }
  }
  return apiPost('/api/plans/auto', body)
}

// ── 미디어 업로드 (E1, S6) ───────────────────────────────────
// formData: file, blockId, mediaType, metadata?
export async function uploadMedia(tripId, formData) {
  if (USE_MOCK) {
    await mockDelay(800)
    return { url: '', mediaType: formData.get?.('mediaType') ?? 'PHOTO', metadata: {} }
  }
  return apiUpload(`/api/trips/${tripId}/media`, formData)
}

// startDate~endDate(포함) 사이의 "YYYY-MM-DD" 배열.
function dayList(startDate, endDate) {
  const out = []
  if (!startDate || !endDate) return [startDate].filter(Boolean)
  const cur = new Date(startDate)
  const end = new Date(endDate)
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// S7 마이페이지가 mypage.js 를 쓰므로 여기선 trip 카드 조회 제외.
// 검색결과/필터 쿼리 헬퍼 노출(테스트 편의).
export { toQuery }
