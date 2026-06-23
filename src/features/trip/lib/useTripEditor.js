// useTripEditor — S6 편집 상태 + 낙관적 저장 컴포저블.
// 로드한 trip 한 건을 로컬 반응 상태로 들고, 블록 조작(추가/수정/삭제/이동/순서)을
// 즉시 로컬 반영(낙관적)한 뒤 debounce 로 updateTrip(전체 저장)을 호출한다.
// 실시간(WS)은 mock 단계라 stub — 저장 성공/실패를 동기화 배지·토스트로만 보여준다.
import { ref, computed } from 'vue'
import { updateTrip } from '@/services/trips'
import { typeKeyOf } from '@/features/trip/lib/blockMeta'

// 새 블록 기본값(슬래시 메뉴 / + 버튼에서 추가).
function blankBlock(koType, visitDate, order) {
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

const PLACEHOLDER_BY_TYPE = {
  관광: '관광지 이름을 적어 주세요',
  식당: '식당 · 카페 이름을 적어 주세요',
  이동: '이동 구간을 적어 주세요 (예: 호텔 → 공항)',
  숙소: '숙소 이름을 적어 주세요',
  메모: '메모를 자유롭게 적어 주세요',
}

export function placeholderFor(koType) {
  return PLACEHOLDER_BY_TYPE[koType] ?? '제목을 적어 주세요'
}

// 반응 프록시·함수가 섞여도 안전한 깊은 복제(원본 변이 방지). data 는 순수 JSON.
function deepClonePlain(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function useTripEditor(initialTrip) {
  // 깊은 복제로 로컬 편집 상태를 만든다(원본 변이 방지).
  const trip = ref(deepClonePlain(initialTrip))

  // 동기화 상태: 'synced' | 'saving' | 'error'
  const syncState = ref('synced')
  let saveTimer = null

  const items = computed(() => trip.value?.data?.items ?? [])

  // visitDate 별 그룹 [{ date, dayIndex, blocks }] (order 정렬).
  const days = computed(() => {
    const map = new Map()
    // 여행 기간 전체 날짜를 우선 채워 빈 Day 도 보이게 한다.
    for (const date of dateRange(trip.value?.start_date, trip.value?.end_date)) {
      map.set(date, [])
    }
    for (const it of items.value) {
      if (!map.has(it.visitDate)) map.set(it.visitDate, [])
      map.get(it.visitDate).push(it)
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, blocks], i) => ({
        date,
        dayIndex: i + 1,
        blocks: [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      }))
  })

  // presence[] → { [blockId]: { name, color } } (편집 중 협업자).
  const editorsByBlock = computed(() => {
    const byId = Object.fromEntries((trip.value?.members ?? []).map((m) => [m.id, m]))
    const out = {}
    for (const p of trip.value?.presence ?? []) {
      const m = byId[p.memberId]
      if (m) out[p.blockId] = { name: m.name, color: p.color ?? m.color }
    }
    return out
  })

  const isEmpty = computed(() => items.value.length === 0)

  // ── 저장(낙관적 + debounce) ────────────────────────────────
  function scheduleSave() {
    syncState.value = 'saving'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(flush, 600)
  }

  async function flush() {
    clearTimeout(saveTimer)
    try {
      await updateTrip(trip.value.trip_id, {
        title: trip.value.title,
        startDate: trip.value.start_date,
        endDate: trip.value.end_date,
        data: trip.value.data,
      })
      syncState.value = 'synced'
      return true
    } catch {
      syncState.value = 'error'
      return false
    }
  }

  // ── 블록 조작(모두 낙관적) ─────────────────────────────────
  function findBlock(id) {
    return items.value.find((b) => b.id === id) ?? null
  }

  function patchBlock(id, patch) {
    const b = findBlock(id)
    if (!b) return
    Object.assign(b, patch)
    scheduleSave()
  }

  function patchProperty(id, key, value) {
    const b = findBlock(id)
    if (!b) return
    if (value === '' || value === null || value === undefined) {
      delete b.properties[key]
    } else {
      b.properties = { ...b.properties, [key]: value }
    }
    scheduleSave()
  }

  function addBlock(koType, visitDate) {
    const sameDay = items.value.filter((b) => b.visitDate === visitDate)
    const maxOrder = sameDay.reduce((m, b) => Math.max(m, b.order ?? 0), 0)
    const block = blankBlock(koType, visitDate, maxOrder + 1)
    trip.value.data.items.push(block)
    scheduleSave()
    return block
  }

  function removeBlock(id) {
    const idx = items.value.findIndex((b) => b.id === id)
    if (idx >= 0) {
      trip.value.data.items.splice(idx, 1)
      scheduleSave()
    }
  }

  // visitDate(=Day) 변경 — 보드뷰 드래그·블록 메뉴에서 사용. 새 날 끝으로 보낸다.
  function moveBlockToDate(id, newDate) {
    const b = findBlock(id)
    if (!b || b.visitDate === newDate) return
    const sameDay = items.value.filter((x) => x.visitDate === newDate)
    const maxOrder = sameDay.reduce((m, x) => Math.max(m, x.order ?? 0), 0)
    b.visitDate = newDate
    b.order = maxOrder + 1
    scheduleSave()
  }

  // 같은 날 안에서 순서 재배치(롱프레스/드래그). orderedIds = 새 순서의 블록 id[].
  function reorderWithin(date, orderedIds) {
    orderedIds.forEach((id, i) => {
      const b = findBlock(id)
      if (b && b.visitDate === date) b.order = i + 1
    })
    scheduleSave()
  }

  // 대표 미디어 선정(갤러리). 한 블록의 한 미디어를 대표로 표시.
  function setRepresentative(blockId, mediaIndex) {
    for (const b of items.value) {
      for (const m of b.media ?? []) delete m.representative
    }
    const b = findBlock(blockId)
    if (b && b.media?.[mediaIndex]) {
      b.media[mediaIndex].representative = true
      scheduleSave()
    }
  }

  function setTitle(title) {
    trip.value.title = title
    scheduleSave()
  }

  return {
    trip,
    items,
    days,
    editorsByBlock,
    isEmpty,
    syncState,
    flush,
    typeKeyOf,
    findBlock,
    patchBlock,
    patchProperty,
    addBlock,
    removeBlock,
    moveBlockToDate,
    reorderWithin,
    setRepresentative,
    setTitle,
  }
}

// startDate~endDate(포함) 사이 "YYYY-MM-DD" 배열. 한쪽이라도 없으면 빈 배열.
export function dateRange(startDate, endDate) {
  const out = []
  if (!startDate || !endDate) return out
  const cur = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}
