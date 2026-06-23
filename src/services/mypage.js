// 마이페이지 도메인 (S7). 내 여행 / 참여중 여행.
import { apiGet } from './api'
import { USE_MOCK, mockDelay, toQuery } from './config'
import * as db from './mock/db'

// scope: 'mine' | 'joined' → TripCard[]
export async function getMyTrips(scope = 'mine') {
  if (USE_MOCK) {
    await mockDelay()
    return db.MY_TRIPS[scope] ?? []
  }
  return apiGet(`/api/mypage/trips${toQuery({ scope })}`)
}

// 상태 산출(CON-07) — 카드에 status 가 없을 때 프론트에서 계산.
export function tripStatus(startDate, endDate, todayStr = new Date().toISOString().slice(0, 10)) {
  if (startDate > todayStr) return '예정'
  if (endDate < todayStr) return '완료'
  return '진행중'
}
