// 큐레이션 도메인 (S1 랜딩 인기 여행지). 공개 API.
import { apiGet } from './api'
import { USE_MOCK, mockDelay, toQuery } from './config'
import * as db from './mock/db'

// params: { period='week', limit=8 } → PopularCard[]
export async function getPopular(params = {}) {
  if (USE_MOCK) {
    await mockDelay()
    const limit = params.limit ?? 8
    return db.POPULAR.slice(0, limit)
  }
  return apiGet(`/api/curation/popular${toQuery({ period: 'week', limit: 8, ...params })}`)
}
