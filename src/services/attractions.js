// 관광지·지역 도메인 (S3 검색 · S4 상세 · S-ADM 관리).
// USE_MOCK 이면 인메모리 mock, 아니면 실제 REST(vite 프록시 → :8080).
// 응답은 평문 JSON(봉투 없음) — 기존 api.js·스토어 규약과 일치.

import { apiGet, apiPost, apiPut, apiDelete } from './api'
import { USE_MOCK, mockDelay, toQuery } from './config'
import * as db from './mock/db'

// ── 지역/테마 옵션 ────────────────────────────────────────────
export async function getSidos() {
  if (USE_MOCK) {
    await mockDelay(150)
    return db.SIDOS
  }
  return apiGet('/api/sidos')
}

export async function getGuguns(sidoCode) {
  if (USE_MOCK) {
    await mockDelay(150)
    return db.GUGUNS[sidoCode] ?? []
  }
  return apiGet(`/api/guguns${toQuery({ sidoCode })}`)
}

export async function getContentTypes() {
  if (USE_MOCK) {
    await mockDelay(100)
    return db.CONTENT_TYPES
  }
  return apiGet('/api/content-types')
}

// ── 검색·목록 (S3) ───────────────────────────────────────────
// params: { sidoCode?, gugunCode?, contentTypeId?(number|number[]), keyword?, page=0, size=12 }
// 반환: { content: Attraction[], page, size, totalElements }
export async function searchAttractions(params = {}) {
  if (USE_MOCK) {
    await mockDelay()
    const { sidoCode, gugunCode, contentTypeId, keyword, page = 0, size = 12 } = params
    const types = contentTypeId == null ? [] : [].concat(contentTypeId).map(Number)
    let list = db.ATTRACTIONS.filter((a) => {
      if (sidoCode != null && a.sidoCode !== Number(sidoCode)) return false
      if (gugunCode != null && a.gugunCode !== Number(gugunCode)) return false
      if (types.length && !types.includes(a.contentTypeId)) return false
      if (keyword && !a.title.includes(keyword)) return false
      return true
    })
    const totalElements = list.length
    const start = page * size
    return {
      content: list.slice(start, start + size),
      page: Number(page),
      size: Number(size),
      totalElements,
    }
  }
  return apiGet(`/api/attractions${toQuery(params)}`)
}

// ── 상세 (S4) ────────────────────────────────────────────────
export async function getAttraction(contentId) {
  if (USE_MOCK) {
    await mockDelay()
    const found = db.ATTRACTIONS.find((a) => a.contentId === Number(contentId))
    if (!found) {
      const err = new Error('찾는 관광지가 없어요. 다른 곳을 둘러볼까요?')
      err.status = 404
      throw err
    }
    return found
  }
  return apiGet(`/api/attractions/${contentId}`)
}

// ── 관리자 CRUD (S-ADM) ──────────────────────────────────────
export async function createAttraction(payload) {
  if (USE_MOCK) {
    await mockDelay()
    const sido = db.SIDOS.find((s) => s.sidoCode === Number(payload.sidoCode))
    const gugun = (db.GUGUNS[payload.sidoCode] ?? []).find(
      (g) => g.gugunCode === Number(payload.gugunCode),
    )
    const row = {
      contentId: null, // 직접 추가 → TourAPI 없음
      no: Date.now(),
      ...payload,
      sidoName: sido?.sidoName ?? '',
      gugunName: gugun?.gugunName ?? '',
      updatedAt: new Date().toISOString().slice(0, 10),
      source: 'MANUAL',
    }
    db.ATTRACTIONS.unshift(row)
    return row
  }
  return apiPost('/api/admin/attractions', payload)
}

export async function updateAttraction(no, payload) {
  if (USE_MOCK) {
    await mockDelay()
    const idx = db.ATTRACTIONS.findIndex((a) => (a.no ?? a.contentId) === Number(no))
    if (idx >= 0) {
      db.ATTRACTIONS[idx] = { ...db.ATTRACTIONS[idx], ...payload }
      return db.ATTRACTIONS[idx]
    }
    return null
  }
  return apiPut(`/api/admin/attractions/${no}`, payload)
}

export async function deleteAttraction(no) {
  if (USE_MOCK) {
    await mockDelay()
    const idx = db.ATTRACTIONS.findIndex((a) => (a.no ?? a.contentId) === Number(no))
    if (idx >= 0) db.ATTRACTIONS.splice(idx, 1)
    return null
  }
  return apiDelete(`/api/admin/attractions/${no}`)
}

// TourAPI 동기 적재 트리거 (S-ADM). mock 은 진행을 흉내내고 끝.
export async function triggerTourApiSync() {
  if (USE_MOCK) {
    await mockDelay(1200)
    return { processed: db.ATTRACTIONS.length, lastSyncedAt: new Date().toISOString() }
  }
  return apiPost('/api/admin/attractions', { sync: true })
}
