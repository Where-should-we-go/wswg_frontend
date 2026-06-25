// 여행 문서 도메인 (S5 자동생성 · S6 편집 · S4 추가 · S7 카드).
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './api'
import { USE_MOCK, mockDelay, toQuery } from './config'
import { getGroupMembers } from './groups'
import * as db from './mock/db'

let mockTripSeq = 100

// 실제 백엔드 TripDto(camelCase) → FE 컴포넌트가 기대하는 표현용 shape(snake_case + 메타).
// 백엔드는 컬럼 + data(JSONB)만 영속하므로 cover/icon/region/styles 등 페이지 메타는
// data.meta 하위에서 읽고(없으면 기본값), members/presence 는 휘발성이라 별도 채운다.
function adaptTrip(dto, members) {
  const data = dto?.data && typeof dto.data === 'object' ? { ...dto.data } : { items: [] }
  if (!Array.isArray(data.items)) data.items = []
  const meta = data.meta && typeof data.meta === 'object' ? data.meta : {}
  // 이 여행에서만 뺀 동행자(그룹 멤버십은 유지). 표시 멤버에서 제외한다.
  const removed = Array.isArray(meta.removedMemberIds) ? meta.removedMemberIds.map(String) : []
  return {
    trip_id: dto.tripId,
    title: dto.title ?? '',
    start_date: dto.startDate ?? null,
    end_date: dto.endDate ?? null,
    user_id: dto.userId ?? null,
    group_id: dto.groupId ?? null,
    groupName: dto.groupName ?? null,
    cover: meta.cover ?? null,
    icon: meta.icon ?? (dto.groupId ? '🧳' : '🗺️'),
    region: meta.region ?? null,
    budgetLabel: meta.budgetLabel ?? '',
    styles: meta.styles ?? [],
    members: (members ?? []).filter((m) => !removed.includes(String(m.id))),
    presence: [],
    data,
  }
}

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
  const dto = await apiGet(`/api/trips/${tripId}`)
  // 그룹 여행이면 멤버를 합성(아바타·프레즌스 출처). 멤버 조회 실패는 무시(빈 배열).
  let members = []
  if (dto?.groupId) {
    members = await getGroupMembers(dto.groupId).catch(() => [])
  }
  return adaptTrip(dto, members)
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

// ── 생성 (D1 빈 문서 / AI 조립 일정) ─────────────────────────
// body: { title, startDate, endDate, groupId?, data? }
// data 를 주면 그 items 를 그대로 담는다(AI 추천 일정 조립). 없으면 빈 문서.
export async function createTrip(body) {
  if (USE_MOCK) {
    await mockDelay()
    const tripId = ++mockTripSeq
    const data =
      body.data && typeof body.data === 'object' ? body.data : { items: [] }
    if (!Array.isArray(data.items)) data.items = []
    db.TRIPS[tripId] = {
      trip_id: tripId,
      title: body.title ?? '새 여행',
      group_id: body.groupId ?? null,
      user_id: db.CURRENT_USER.id,
      start_date: body.startDate ?? null,
      end_date: body.endDate ?? null,
      cover: null,
      icon: data.meta?.icon ?? '🗺️',
      region: data.meta?.region ?? null,
      budgetLabel: data.meta?.budgetLabel ?? '',
      styles: data.meta?.styles ?? [],
      members: [{ id: 'u1', name: '태호', initial: '태', color: 'var(--collab-1)' }],
      presence: [],
      data,
    }
    return { tripId }
  }
  return apiPost('/api/trips', body)
}

// ── 자동 생성 (S5) ───────────────────────────────────────────
// AI 후보 선택 기반 흐름으로 이관됨 → services/aiTrip.js (POST /api/ai/trip-*).

function mediaTypeOf(file) {
  const contentType = file?.type ?? ''
  if (contentType.startsWith('video/')) return 'VIDEO'
  if (contentType.startsWith('audio/')) return 'AUDIO'
  return 'PHOTO'
}

// ── 미디어 업로드 (E1, S6) ───────────────────────────────────
// 미디어 업로드 — 백엔드: POST /api/trips/{tripId}/items/{itemId}/media (multipart: file, mediaType)
// itemId = 블록 id (trips.data.items[].id). 형식·용량 검증은 호출부(onUploadMedia)에서 선반영.
export async function uploadMedia(tripId, itemIdOrFormData, fileArg) {
  if (USE_MOCK) {
    await mockDelay(800)
    const file = fileArg ?? itemIdOrFormData?.get?.('file')
    return {
      mediaId: `mock-media-${Date.now()}`,
      mediaUrl: '',
      mediaType: itemIdOrFormData?.get?.('mediaType') ?? mediaTypeOf(file),
      metadata: {
        originalFilename: file?.name ?? 'media',
        contentType: file?.type ?? '',
        size: file?.size ?? 0,
      },
    }
  }
  const itemId = itemIdOrFormData
  const formData = new FormData()
  formData.append('file', fileArg)
  formData.append('mediaType', mediaTypeOf(fileArg))

  return apiUpload(`/api/trips/${tripId}/items/${encodeURIComponent(itemId)}/media`, formData)
}

// S7 마이페이지가 mypage.js 를 쓰므로 여기선 trip 카드 조회 제외.
// 검색결과/필터 쿼리 헬퍼 노출(테스트 편의).
export { toQuery }
