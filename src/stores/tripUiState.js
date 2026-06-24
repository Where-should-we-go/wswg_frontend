import { reactive } from 'vue'

// 에디터에서 편집 중인 트립 제목을 사이드바 등 다른 화면이 즉시 반영하도록 공유하는 reactive 맵.
// 에디터/사이드바가 서로 다른 데이터 출처(useTripEditor 로컬 vs getMyTrips)를 쓰므로,
// 저장 왕복 없이도 화면 간 제목을 동기화하기 위한 가벼운 공유 상태.
const tripTitleOverrides = reactive({})

export function setTripTitleOverride(tripId, title) {
  if (tripId == null) return
  tripTitleOverrides[tripId] = title
}

// 오버라이드가 있으면 그 제목, 없으면 fallback(서버/목 제목).
export function displayTripTitle(tripId, fallback) {
  return tripTitleOverrides[tripId] ?? fallback
}

export { tripTitleOverrides }
