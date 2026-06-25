// useTripEditor — S6 편집 상태 + 낙관적 저장 + 실시간 공동편집 컴포저블.
// 로드한 trip 한 건을 로컬 반응 상태로 들고, 블록 조작(추가/수정/삭제/이동/순서)을
// 즉시 로컬 반영(낙관적)한다.
//   · 실서버 모드(VITE_USE_MOCK=false) + 로그인: 각 편집을 WS op 로 송신하고
//     다른 참가자의 broadcast 를 수신해 로컬에 병합한다. 영속은 서버 배치 워커가 담당.
//   · mock/오프라인(소켓 미연결): debounce 로 updateTrip(전체 PUT) 폴백.
import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { updateTrip } from '@/services/trips'
import { typeKeyOf } from '@/features/trip/lib/blockMeta'
import { timeToMinutes, minutesToTime, DEFAULT_DURATION_MIN } from '@/features/trip/lib/calendar'
import { USE_MOCK } from '@/services/config'
import * as authService from '@/services/auth'
import { createPlanSocket, userIdFromToken } from '@/features/trip/lib/planSocket'

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

// 타임라인 정렬: 시간 있는 블록은 시각 오름차순(같으면 order), 시간 미정은 맨 뒤에서 order 순.
// 일정은 시간 순서로 보여야 하므로, 시간 있는 블록끼리는 수동 order 가 아니라 time 으로 정렬한다.
function compareForTimeline(a, b) {
  const ta = a.time
  const tb = b.time
  if (ta && tb) return ta < tb ? -1 : ta > tb ? 1 : (a.order ?? 0) - (b.order ?? 0)
  if (ta) return -1 // 시간 있는 블록을 시간 미정보다 앞에
  if (tb) return 1
  return (a.order ?? 0) - (b.order ?? 0) // 둘 다 시간 미정 → 수동 order
}

// TourAPI contentTypeId → 블록 한글 타입. 음식점=39, 숙박=32, 그 외는 관광.
function koTypeForContentType(contentTypeId) {
  if (contentTypeId === 39) return '식당'
  if (contentTypeId === 32) return '숙소'
  return '관광'
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

  // ── 실시간 공동편집(WS) 상태 ───────────────────────────────
  // 실서버 모드 + 토큰 + trip_id 있을 때만 활성(mock·단위테스트에선 비활성).
  const token =
    !USE_MOCK && typeof authService.getAccessToken === 'function'
      ? authService.getAccessToken()
      : null
  const myUserId = token ? userIdFromToken(token) : null
  // 탭/기기별 고유 ID. 자기 echo 판별을 userId 가 아닌 이 값으로 한다
  // (같은 계정으로 두 탭을 열어도 서로의 편집이 반영되도록).
  const myClientId = `c-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
  const realtimeEnabled =
    !USE_MOCK && typeof WebSocket !== 'undefined' && !!token && !!trip.value?.trip_id
  const realtimeReady = ref(false) // 소켓 open 여부(툴바 배지)
  const presenceMap = ref({}) // { [memberId]: blockId } — 휘발성 프레즌스
  let socket = null

  const items = computed(() => trip.value?.data?.items ?? [])

  // visitDate 별 그룹 [{ date, dayIndex, blocks }].
  // 시간 있는 블록은 시각 오름차순(일정은 시간 순서로 보여야 함), 시간 미정은 맨 뒤 수동 order 순.
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
        blocks: [...blocks].sort(compareForTimeline),
      }))
  })

  // presence → { [blockId]: { name, color } } (편집 중 협업자, 나 자신은 제외).
  // 실시간 모드는 presenceMap(WS), 그 외는 trip.presence(mock)를 본다.
  const editorsByBlock = computed(() => {
    const byId = Object.fromEntries((trip.value?.members ?? []).map((m) => [String(m.id), m]))
    const entries = realtimeEnabled
      ? Object.entries(presenceMap.value).map(([memberId, blockId]) => ({ memberId, blockId }))
      : (trip.value?.presence ?? []).map((p) => ({
          memberId: p.memberId,
          blockId: p.blockId,
          color: p.color,
        }))
    const out = {}
    for (const p of entries) {
      if (myUserId && String(p.memberId) === myUserId) continue
      if (!p.blockId) continue
      const m = byId[String(p.memberId)]
      out[p.blockId] = {
        name: m?.name ?? `사용자 ${p.memberId}`,
        color: p.color ?? m?.color ?? 'var(--collab-1)',
      }
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

  // ── 실시간 송신/수신 ───────────────────────────────────────
  // op 를 WS 로 송신(성공 시 true). 영속은 서버 배치 워커가 담당하므로 PUT 생략.
  // 소켓 미연결이면 false → 호출부가 scheduleSave(PUT)로 폴백.
  function sendOp(type, payload) {
    // payload 에 clientId 를 실어 보낸다(서버가 block/meta op 의 payload 를 그대로 echo →
    // 수신 측에서 자기 탭이 보낸 것인지 판별). block 안이 아니라 payload 최상위에 둠.
    const withCid = { ...payload, clientId: myClientId }
    if (socket && socket.send({ type, tripId: trip.value.trip_id, payload: withCid })) {
      syncState.value = 'saving' // 서버 ack 수신 시 synced
      return true
    }
    return false
  }

  // 블록 편집 1건: 실시간이면 op 송신 + 편집 중 프레즌스 알림, 아니면 PUT 폴백.
  function commitEdit(type, payload, blockId) {
    const sent = sendOp(type, payload)
    if (sent) {
      if (blockId) sendOp('presence', { blockId })
    } else {
      scheduleSave()
    }
  }

  // 텍스트 라이브 입력(노션식)용 — 로컬은 키 입력마다 즉시 반영하되, WS op·PUT 은
  // 디바운스로 모아 보낸다(키마다 송신 시 트래픽 폭증·상대 커서 덮어쓰기 방지).
  const liveTimers = new Map()
  const livePatches = new Map()
  function patchBlockLive(id, patch) {
    const b = findBlock(id)
    if (!b) return
    Object.assign(b, patch) // 로컬 즉시(캘린더·보드 등 다른 뷰도 함께 갱신)
    const merged = { ...livePatches.get(id), ...patch }
    livePatches.set(id, merged)
    clearTimeout(liveTimers.get(id))
    liveTimers.set(
      id,
      setTimeout(() => {
        const p = livePatches.get(id) ?? {}
        livePatches.delete(id)
        liveTimers.delete(id)
        commitEdit('block.update', { id, patch: p }, id)
      }, 300),
    )
  }

  // 문서 제목 라이브 입력용 디바운스 meta.update 송신.
  let metaTimer = null
  let metaPatch = {}
  function scheduleMetaSend(patch) {
    metaPatch = { ...metaPatch, ...patch }
    clearTimeout(metaTimer)
    metaTimer = setTimeout(() => {
      const p = metaPatch
      metaPatch = {}
      sendOp('meta.update', { patch: p })
    }, 300)
  }

  // 서버 block.update patch 병합 규칙과 동일(얕은 병합 + properties 키단위 + media 통째).
  function applyPatch(block, patch) {
    for (const [key, value] of Object.entries(patch ?? {})) {
      if (key === 'properties') {
        if (value == null) {
          block.properties = {}
          continue
        }
        const props = { ...block.properties }
        for (const [pk, pv] of Object.entries(value)) {
          if (pv === null || pv === '' || (typeof pv === 'string' && !pv.trim())) delete props[pk]
          else props[pk] = pv
        }
        block.properties = props
      } else {
        block[key] = value
      }
    }
  }

  // 서버에서 온 메시지를 로컬 상태에 반영.
  function applyRemote(msg) {
    const type = msg?.type
    if (type === 'sync') {
      const data = msg.payload?.data
      if (data && typeof data === 'object') {
        if (!Array.isArray(data.items)) data.items = []
        trip.value.data = data
      }
      const next = {}
      for (const p of msg.payload?.presence ?? []) {
        const mid = String(p.memberId ?? '')
        if (mid && p.blockId) next[mid] = p.blockId
      }
      presenceMap.value = next
      realtimeReady.value = true
      syncState.value = 'synced'
      return
    }
    if (type === 'ack') {
      syncState.value = 'synced'
      return
    }
    if (type === 'error') {
      syncState.value = 'error'
      return
    }
    if (type === 'presence') {
      const mid = String(msg.actor?.userId ?? '')
      if (!mid) return
      const blockId = msg.payload?.blockId ?? null
      const next = { ...presenceMap.value }
      if (blockId) next[mid] = blockId
      else delete next[mid]
      presenceMap.value = next
      return
    }
    // block.* / meta.update — 이 탭이 보낸 echo 만 건너뜀(같은 계정의 다른 탭/기기는 반영).
    if (msg.payload?.clientId && msg.payload.clientId === myClientId) return
    if (type === 'block.add') {
      const block = msg.payload?.block ?? msg.payload
      if (block?.id && !findBlock(block.id)) trip.value.data.items.push(block)
    } else if (type === 'block.update') {
      const b = findBlock(msg.payload?.id)
      if (b) applyPatch(b, msg.payload?.patch)
    } else if (type === 'block.remove') {
      const idx = items.value.findIndex((b) => b.id === msg.payload?.id)
      if (idx >= 0) trip.value.data.items.splice(idx, 1)
    } else if (type === 'meta.update') {
      const patch = msg.payload?.patch ?? {}
      if ('title' in patch) trip.value.title = patch.title
      trip.value.data.meta = { ...trip.value.data.meta, ...patch }
    }
  }

  // 실시간 연결 수립/해제(컴포넌트 setup 안에서만).
  if (realtimeEnabled && getCurrentInstance()) {
    onMounted(() => {
      socket = createPlanSocket({
        tripId: trip.value.trip_id,
        token,
        onMessage: applyRemote,
        onStatus: (s) => {
          if (s === 'open') realtimeReady.value = true
          else if (s === 'closed' || s === 'error') realtimeReady.value = false
        },
      })
    })
    onBeforeUnmount(() => {
      socket?.close()
      socket = null
    })
  }

  // ── 블록 조작(모두 낙관적) ─────────────────────────────────
  function findBlock(id) {
    return items.value.find((b) => b.id === id) ?? null
  }

  function patchBlock(id, patch) {
    const b = findBlock(id)
    if (!b) return
    Object.assign(b, patch)
    commitEdit('block.update', { id, patch }, id)
  }

  function patchProperty(id, key, value) {
    const b = findBlock(id)
    if (!b) return
    const empty = value === '' || value === null || value === undefined
    if (empty) {
      delete b.properties[key]
    } else {
      b.properties = { ...b.properties, [key]: value }
    }
    // 서버 규약: properties 내부 값이 null/'' 이면 그 키 삭제.
    commitEdit('block.update', { id, patch: { properties: { [key]: empty ? null : value } } }, id)
  }

  function addBlock(koType, visitDate) {
    const sameDay = items.value.filter((b) => b.visitDate === visitDate)
    const maxOrder = sameDay.reduce((m, b) => Math.max(m, b.order ?? 0), 0)
    const block = blankBlock(koType, visitDate, maxOrder + 1)
    trip.value.data.items.push(block)
    commitEdit('block.add', { block }, block.id)
    return block
  }

  // 검색한 관광지(Attraction)를 블록으로 추가. content_id·좌표·지역·대표사진을 채운다.
  function addPlaceBlock(place, visitDate) {
    if (!place) return null
    const sameDay = items.value.filter((b) => b.visitDate === visitDate)
    const maxOrder = sameDay.reduce((m, b) => Math.max(m, b.order ?? 0), 0)
    const block = blankBlock(koTypeForContentType(place.contentTypeId), visitDate, maxOrder + 1)
    block.content_id = place.contentId ?? null
    block.title = place.title ?? ''
    // 실서버 상세는 latitude/longitude, mock 은 mapY/mapX 를 쓴다(둘 다 수용).
    block.lat = place.latitude ?? place.mapY ?? null
    block.lng = place.longitude ?? place.mapX ?? null
    if (place.firstImage1) block.media = [{ type: 'PHOTO', url: place.firstImage1, metadata: {} }]
    const region = [place.sidoName, place.gugunName].filter(Boolean).join(' ')
    block.properties = {
      ...(region ? { region } : {}),
      ...(place.addr1 ? { address: place.addr1 } : {}),
    }
    trip.value.data.items.push(block)
    commitEdit('block.add', { block }, block.id)
    return block
  }

  function removeBlock(id) {
    const idx = items.value.findIndex((b) => b.id === id)
    if (idx >= 0) {
      trip.value.data.items.splice(idx, 1)
      commitEdit('block.remove', { id })
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
    commitEdit('block.update', { id, patch: { visitDate: newDate, order: b.order } }, id)
  }

  // 캘린더 드래그로 일정 조율 — time·소요시간·일차를 한 번에 변경(block.update 1건).
  // 일차가 바뀌면 새 날 끝으로 order 도 같이 옮긴다(레일 뷰 정렬 일관성).
  function setBlockSchedule(id, patch) {
    const b = findBlock(id)
    if (!b) return
    const next = {}
    if ('time' in patch) next.time = patch.time
    if ('durationMin' in patch) next.durationMin = patch.durationMin
    if (patch.visitDate && patch.visitDate !== b.visitDate) {
      next.visitDate = patch.visitDate
      const sameDay = items.value.filter((x) => x.visitDate === patch.visitDate)
      next.order = sameDay.reduce((m, x) => Math.max(m, x.order ?? 0), 0) + 1
    }
    if (Object.keys(next).length === 0) return
    Object.assign(b, next)
    commitEdit('block.update', { id, patch: next }, id)
  }

  // WS op(있으면) / PUT 폴백 — 프레즌스 없이 조용히 보냄(재패킹은 블록 여럿 갱신).
  function pushUpdate(id, patch) {
    if (!sendOp('block.update', { id, patch })) scheduleSave()
  }

  // 순차 재패킹 — 순서(orderedIds)대로 시간 있는 블록을 겹침 없이 이어 배치하고,
  // 시간 미정 블록은 맨 뒤 수동 order 로 둔다. overrides[id]=true/false 로 시간 부여/해제(양방향).
  //   앵커 = 그 날의 가장 이른 기존 시각(없으면 09:00) → 하루 시작 시각은 유지.
  // 끌어넣기(insert-between): 옮긴 블록만 새 이웃 사이 시간으로 두고 나머지 시간은 보존한다.
  // 앞 블록이 있으면 그 끝에 붙이고, 없으면 다음 블록 직전에 둔다. 겹치면 그 뒤만 밀어낸다(cascade).
  // draggedTimed: 드롭 지점이 시간 있는 블록 옆이면 true(시각 부여), 미정 영역이면 false(시각 해제).
  function repackDay(date, orderedIds, draggedId, draggedTimed) {
    const blocks = orderedIds.map((id) => findBlock(id)).filter((b) => b && b.visitDate === date)
    const isTimed = (b) => (b.id === draggedId ? draggedTimed : b.time != null)
    const timed = blocks.filter(isTimed)
    const untimed = blocks.filter((b) => !isTimed(b))
    const dur = (b) =>
      b.durationMin != null && Number(b.durationMin) > 0 ? Number(b.durationMin) : DEFAULT_DURATION_MIN

    const i = timed.findIndex((b) => b.id === draggedId)
    if (i !== -1) {
      // 옮긴 블록의 시작 시각: 앞 블록 끝 → 없으면 다음 블록 직전 → 둘 다 없으면 기존/09:00.
      const prev = i > 0 ? timed[i - 1] : null
      const next = i < timed.length - 1 ? timed[i + 1] : null
      let draggedStart
      if (prev && timeToMinutes(prev.time) != null) {
        draggedStart = timeToMinutes(prev.time) + dur(prev)
      } else if (next && timeToMinutes(next.time) != null) {
        draggedStart = Math.max(0, timeToMinutes(next.time) - dur(timed[i]))
      } else {
        draggedStart = timeToMinutes(timed[i].time) ?? 9 * 60
      }
      // 앞쪽 블록은 시간 보존, 옮긴 지점부터는 겹칠 때만 뒤로 밀기(cascade).
      let cursor = -1
      timed.forEach((b, j) => {
        let start
        if (j < i) {
          start = timeToMinutes(b.time) ?? Math.max(0, cursor)
        } else if (j === i) {
          start = Math.max(draggedStart, cursor < 0 ? draggedStart : cursor)
        } else {
          const existing = timeToMinutes(b.time)
          start = existing != null ? Math.max(existing, cursor) : Math.max(0, cursor)
        }
        const nt = minutesToTime(Math.min(start, 1439))
        if (b.time !== nt) {
          b.time = nt
          pushUpdate(b.id, { time: nt })
        }
        cursor = start + dur(b)
      })
    }

    untimed.forEach((b, idx) => {
      const patch = {}
      if (b.time != null) {
        b.time = null
        patch.time = null
      }
      if ((b.order ?? 0) !== idx + 1) {
        b.order = idx + 1
        patch.order = idx + 1
      }
      if (Object.keys(patch).length) pushUpdate(b.id, patch)
    })
  }

  // 같은 날 안에서 순서 재배치(롱프레스/드래그). orderedIds = 새 순서의 블록 id[].
  function reorderWithin(date, orderedIds) {
    let sent = false
    orderedIds.forEach((id, i) => {
      const b = findBlock(id)
      if (b && b.visitDate === date) {
        b.order = i + 1
        if (sendOp('block.update', { id, patch: { order: b.order } })) sent = true
      }
    })
    if (!sent) scheduleSave()
  }

  // 미디어 append(E1 업로드). 업로드된 { type, url, metadata } 를 블록 media[] 끝에 더한다.
  // persist=false: 로컬에만 반영(서버가 이미 저장한 경우). 미디어 업로드는 백엔드 업로드
  // 엔드포인트가 trip.data 에 직접 저장하므로, FE 가 또 block.update 로 커밋하면 2장으로 중복된다.
  function addMedia(blockId, media, persist = true) {
    const b = findBlock(blockId)
    if (!b) return
    if (!Array.isArray(b.media)) b.media = []
    // 실시간(WS) 브로드캐스트로 같은 미디어가 먼저 들어올 수 있으므로 id 로 중복 제거.
    if (media.id != null && b.media.some((m) => m.id === media.id)) return
    b.media.push(media)
    if (persist) {
      // media 는 통째 교체 규약 → 현재 배열 전체를 patch.media 로 전송.
      commitEdit('block.update', { id: blockId, patch: { media: b.media } }, blockId)
    }
  }

  // 미디어 삭제 — 로컬 제거 후 media 배열 통째로 block.update op 전송(addMedia 와 동일 규약).
  // raw PUT 만 하면 collab plan-state(Redis)에 미디어가 남아 flush 워커가 되살리므로 op 로 보낸다.
  // 소켓 미연결이면 commitEdit 가 PUT(scheduleSave)로 폴백. OCI 객체 자체 정리는 후속 과제.
  function removeMedia(blockId, mediaIndex) {
    const b = findBlock(blockId)
    if (!b || !Array.isArray(b.media) || mediaIndex < 0 || mediaIndex >= b.media.length) return
    b.media.splice(mediaIndex, 1)
    commitEdit('block.update', { id: blockId, patch: { media: b.media } }, blockId)
  }

  // 대표 미디어 선정(갤러리). 한 블록의 한 미디어를 대표로 표시.
  function setRepresentative(blockId, mediaIndex) {
    for (const b of items.value) {
      for (const m of b.media ?? []) delete m.representative
    }
    const b = findBlock(blockId)
    if (b && b.media?.[mediaIndex]) {
      b.media[mediaIndex].representative = true
      commitEdit('block.update', { id: blockId, patch: { media: b.media } }, blockId)
    }
  }

  function setTitle(title) {
    trip.value.title = title
    // 제목은 trips 컬럼이라 배치 워커가 영속하지 않음 → 실시간 echo(meta.update, 디바운스) +
    // 컬럼 영속을 위한 PUT(debounce) 둘 다 수행.
    scheduleMetaSend({ title })
    scheduleSave()
  }

  return {
    trip,
    items,
    days,
    editorsByBlock,
    isEmpty,
    syncState,
    realtimeEnabled,
    realtimeReady,
    flush,
    typeKeyOf,
    findBlock,
    patchBlock,
    patchBlockLive,
    patchProperty,
    addBlock,
    addPlaceBlock,
    removeBlock,
    moveBlockToDate,
    setBlockSchedule,
    repackDay,
    reorderWithin,
    addMedia,
    removeMedia,
    setRepresentative,
    setTitle,
  }
}

// startDate~endDate(포함) 사이 "YYYY-MM-DD" 배열. 한쪽이라도 없으면 빈 배열.
// 로컬 자정으로 파싱하므로 포맷도 로컬 기준으로 한다(toISOString=UTC 를 쓰면 KST 등에서
// 하루 밀려 Day1 이 전날로 잡히는 버그가 생긴다).
export function dateRange(startDate, endDate) {
  const out = []
  if (!startDate || !endDate) return out
  const cur = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (cur <= end) {
    out.push(toLocalIsoDate(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// 로컬 시간대 기준 "YYYY-MM-DD" (toISOString 의 UTC 변환 회피).
function toLocalIsoDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
