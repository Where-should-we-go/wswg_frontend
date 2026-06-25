// 발자취 지도 도메인 (S8). group_region_media 기반.
import { apiGet, apiPost, apiDelete } from './api'
import { USE_MOCK, mockDelay, toQuery } from './config'
import * as db from './mock/db'

let mockMediaSeq = 1000

// 지도 진입: 지역별 대표 추억 1개 목록. 프론트가 GeoJSON 권역을 보유여부로 색칠.
export async function getGroupMap(groupId, params = {}) {
  if (USE_MOCK) {
    await mockDelay()
    let list = db.REGION_MEDIA[groupId] ?? []
    // 드릴다운: sidoCode/gugunCode 주어지면 그 지역만(갤러리 집계 대용)
    if (params.sidoCode != null) {
      list = list.filter((m) => m.sidoCode === Number(params.sidoCode))
      if (params.gugunCode != null) {
        list = list.filter((m) => m.gugunCode === Number(params.gugunCode))
      }
    }
    if (params.mediaType != null) {
      list = list.filter((m) => normalizeMediaType(m.mediaType) === normalizeMediaType(params.mediaType))
    }
    return list.map(normalizeGroupMedia)
  }
  const rows = await apiGet(`/api/groups/${groupId}/media${toQuery(params)}`)
  return (rows ?? []).map(normalizeGroupMedia)
}

function normalizeGroupMedia(row) {
  const sidoName = row.sidoName ?? db.SIDOS.find((s) => s.sidoCode === Number(row.sidoCode))?.sidoName ?? ''
  const gugunName =
    row.gugunName ??
    (db.GUGUNS[row.sidoCode] ?? []).find((g) => g.gugunCode === Number(row.gugunCode))?.gugunName ??
    ''
  const blockTitle = row.blockTitle ?? row.attractionTitle ?? row.caption ?? ''
  const visitDate = row.visitDate ?? row.metadata?.visitDate ?? ''
  return {
    ...row,
    id:
      row.id ??
      [row.tripId, row.blockId, row.mediaUrl, row.mediaType].filter((v) => v != null && v !== '').join(':'),
    sidoCode: Number(row.sidoCode),
    gugunCode: row.gugunCode == null ? null : Number(row.gugunCode),
    mediaType: normalizeMediaType(row.mediaType),
    regionLabel: [sidoName, gugunName].filter(Boolean).join(' ') || row.regionLabel || '지역 미상',
    caption: row.caption ?? [blockTitle, visitDate].filter(Boolean).join(' · '),
  }
}

function normalizeMediaType(mediaType) {
  const normalized = String(mediaType ?? '').toUpperCase()
  return normalized === 'VOICE' ? 'AUDIO' : normalized
}

// 대표 추억 큐레이션(E3). 지역당 1개 upsert.
// payload: { tripId, sidoCode, gugunCode?, mediaUrl, mediaType }
export async function curateRepresentative(groupId, payload) {
  if (USE_MOCK) {
    await mockDelay()
    const list = (db.REGION_MEDIA[groupId] ??= [])
    const key = (m) => `${m.sidoCode}-${m.gugunCode ?? -1}`
    const incoming = { id: ++mockMediaSeq, ...payload }
    const idx = list.findIndex((m) => key(m) === key(incoming))
    if (idx >= 0) list[idx] = { ...list[idx], ...incoming }
    else list.push(incoming)
    return incoming
  }
  return apiPost(`/api/groups/${groupId}/map`, payload)
}

export async function removeRepresentative(groupId, id) {
  if (USE_MOCK) {
    await mockDelay()
    const list = db.REGION_MEDIA[groupId] ?? []
    db.REGION_MEDIA[groupId] = list.filter((m) => m.id !== Number(id))
    return null
  }
  return apiDelete(`/api/groups/${groupId}/map/${id}`)
}
