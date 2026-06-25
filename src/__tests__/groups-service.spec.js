import { describe, expect, it } from 'vitest'
import { buildInviteLinkUrl, normalizeInviteLink } from '@/services/groups'

describe('groups service invite link', () => {
  it('token만 내려와도 복사 가능한 초대 URL을 만든다', () => {
    const link = normalizeInviteLink({
      groupId: 5,
      token: 'abc 123',
      expiresAt: '2026-06-25T12:00:00+09:00',
    })

    expect(link.url).toBe(`${location.origin}/groups/join?token=abc%20123`)
  })

  it('서버가 URL 필드를 내려주면 그 값을 유지한다', () => {
    const url = 'https://example.com/groups/join?token=server-token'

    expect(normalizeInviteLink({ token: 'server-token', url }).url).toBe(url)
    expect(normalizeInviteLink({ token: 'server-token', inviteUrl: url }).url).toBe(url)
  })

  it('서버가 상대 URL을 내려주면 현재 origin 기준으로 보정한다', () => {
    const link = normalizeInviteLink({
      token: 'server-token',
      url: '/groups/join?token=server-token',
    })

    expect(link.url).toBe(`${location.origin}/groups/join?token=server-token`)
  })

  it('토큰이 없으면 빈 URL을 반환한다', () => {
    expect(buildInviteLinkUrl('')).toBe('')
  })
})
