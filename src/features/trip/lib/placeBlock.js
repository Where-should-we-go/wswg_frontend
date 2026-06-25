// 관광지 검색/상세/에디터에서 같은 trips.data.items 블록 형태를 만들기 위한 헬퍼.

export function blankBlock(koType, visitDate, order) {
  return {
    id: `b-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`,
    content_id: null,
    title: '',
    type: koType,
    lat: null,
    lng: null,
    visitDate,
    time: null,
    durationMin: null,
    order,
    media: [],
    properties: {},
  }
}

// TourAPI contentTypeId → 블록 한글 타입. 음식점=39, 숙박=32, 그 외는 관광.
export function koTypeForContentType(contentTypeId) {
  if (contentTypeId === 39) return '식당'
  if (contentTypeId === 32) return '숙소'
  return '관광'
}

export function placeRegionLabel(place) {
  return [place?.sidoName, place?.gugunName].filter(Boolean).join(' ')
}

export function buildPlaceBlock(place, { visitDate = null, order = 1 } = {}) {
  const block = blankBlock(koTypeForContentType(place?.contentTypeId), visitDate, order)
  block.content_id = place?.contentId ?? null
  block.title = place?.title ?? ''
  block.lat = place?.latitude ?? place?.mapY ?? null
  block.lng = place?.longitude ?? place?.mapX ?? null
  if (place?.firstImage1) block.media = [{ type: 'PHOTO', url: place.firstImage1, metadata: {} }]

  const region = placeRegionLabel(place)
  block.properties = {
    ...(region ? { region } : {}),
    ...(place?.addr1 ? { address: place.addr1 } : {}),
  }
  return block
}
