// 모임 도메인 (S9 모임 관리 · 셸 워크스페이스 스위처).
import { apiGet, apiPost, apiDelete } from './api'
import { USE_MOCK, mockDelay } from './config'
import * as db from './mock/db'

let mockGroupSeq = 100
let mockUserSeq = 100

// 카드/스위처용 요약(+멤버수).
export async function getGroups() {
  if (USE_MOCK) {
    await mockDelay()
    return db.GROUPS.map((g) => ({ ...g, memberCount: g.members.length }))
  }
  return apiGet('/api/groups')
}

export async function getGroup(groupId) {
  if (USE_MOCK) {
    await mockDelay(150)
    const g = db.GROUPS.find((x) => x.groupId === Number(groupId))
    return g ? { ...g, memberCount: g.members.length } : null
  }
  return apiGet(`/api/groups/${groupId}`)
}

// 그룹 멤버 목록 (S6 공동편집 아바타·프레즌스 출처). GroupMemberDto[] →
// FE 표현용 멤버 { id, userId, name, initial, color, profileImageUrl, role }.
export async function getGroupMembers(groupId) {
  if (USE_MOCK) {
    await mockDelay(150)
    const g = db.GROUPS.find((x) => x.groupId === Number(groupId))
    return (g?.members ?? []).map((m, i) =>
      toMember(m.userId ?? m.id, m.name, m.profileImageUrl, m.role === 'OWNER', i),
    )
  }
  const rows = await apiGet(`/api/groups/${groupId}/members`)
  return (rows ?? []).map((m, i) => toMember(m.userId, m.name, m.profileImageUrl, m.owner, i))
}

// 멤버 1명 → FE 표현용. 협업 카렛 색은 collab-1/2/3 토큰을 순환 배정.
function toMember(userId, name, profileImageUrl, owner, index) {
  const label = name ?? `사용자 ${userId}`
  return {
    id: String(userId),
    userId,
    name: label,
    initial: label.slice(0, 1),
    color: `var(--collab-${(index % 3) + 1})`,
    profileImageUrl: profileImageUrl ?? '',
    role: owner ? 'OWNER' : 'MEMBER',
  }
}

export async function createGroup(groupName) {
  if (USE_MOCK) {
    await mockDelay()
    const group = {
      groupId: ++mockGroupSeq,
      groupName,
      emoji: '✨',
      tripCount: 0,
      members: [{ ...db.CURRENT_USER, userId: db.CURRENT_USER.id, role: 'OWNER', joinedAt: today() }],
    }
    db.GROUPS.unshift(group)
    return { ...group, memberCount: group.members.length }
  }
  return apiPost('/api/groups', { groupName })
}

// 초대 링크 발급(C2). 토큰 URL + 만료.
export async function createInviteLink(groupId) {
  if (USE_MOCK) {
    await mockDelay()
    const token = `mock-${groupId}-${Math.floor(performance.now())}`
    return normalizeInviteLink({
      token,
      expiresAt: '24시간 뒤 만료',
    })
  }
  return normalizeInviteLink(await apiPost(`/api/groups/${groupId}/invite-link`))
}

export function normalizeInviteLink(link) {
  if (!link) return null

  const token = link.token ?? ''
  const url = toAbsoluteInviteUrl(link.url || link.inviteUrl) || buildInviteLinkUrl(token)

  return {
    ...link,
    token,
    url,
  }
}

export function buildInviteLinkUrl(token) {
  if (!token) return ''

  return `${location.origin}/groups/join?token=${encodeURIComponent(token)}`
}

function toAbsoluteInviteUrl(url) {
  if (!url) return ''

  return new URL(url, location.origin).toString()
}

export async function joinByToken(token) {
  if (USE_MOCK) {
    await mockDelay()
    return db.GROUPS[0]
      ? { groupId: db.GROUPS[0].groupId, userId: db.CURRENT_USER.id, status: 'PENDING' }
      : null
  }
  return apiPost('/api/groups/join', { token })
}

export async function getJoinRequests(groupId) {
  if (USE_MOCK) {
    await mockDelay()
    return []
  }
  return apiGet(`/api/groups/${groupId}/join-requests`)
}

export async function approveJoinRequest(groupId, requestId) {
  if (USE_MOCK) {
    await mockDelay()
    return null
  }
  return apiPost(`/api/groups/${groupId}/join-requests/${requestId}/approve`, {})
}

// 멤버 직접 추가(C2). payload: { name|email }
export async function addMember(groupId, payload) {
  if (USE_MOCK) {
    await mockDelay()
    const g = db.GROUPS.find((x) => x.groupId === Number(groupId))
    if (!g) return null
    const member = {
      userId: `u${++mockUserSeq}`,
      name: payload.name ?? payload.email ?? '새 멤버',
      profileImageUrl: '',
      role: 'MEMBER',
      joinedAt: today(),
    }
    g.members.push(member)
    return member
  }
  return apiPost(`/api/groups/${groupId}/members`, payload)
}

export async function removeMember(groupId, userId) {
  if (USE_MOCK) {
    await mockDelay()
    const g = db.GROUPS.find((x) => x.groupId === Number(groupId))
    if (g) g.members = g.members.filter((m) => m.userId !== userId)
    return null
  }
  return apiDelete(`/api/groups/${groupId}/members/${userId}`)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
