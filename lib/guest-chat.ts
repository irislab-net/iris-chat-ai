import { chatApiPath, unwrapChatPayload } from "@/lib/api/chat"
import type { TrialInfo } from "@/lib/api/types"

export const STORAGE_GUEST_TOKEN = "iris_guest_token"
export const STORAGE_GUEST_USER_ID = "iris_guest_user_id"

export type GuestSessionResponse = {
  guest_token: string
  user_id: string
  trial: TrialInfo
}

export type AccountMergeResponse = {
  merged_sessions: number
  merged_messages: number
  guest_user_id: string
  user_id: string
}

export class GuestChatError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public trial?: TrialInfo
  ) {
    super(message)
    this.name = "GuestChatError"
  }
}

export function getStoredGuestToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_GUEST_TOKEN)
}

export function getStoredGuestUserId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_GUEST_USER_ID)
}

export function storeGuestSession(data: GuestSessionResponse) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_GUEST_TOKEN, data.guest_token)
  localStorage.setItem(STORAGE_GUEST_USER_ID, data.user_id)
}

export function clearGuestStorage() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_GUEST_TOKEN)
  localStorage.removeItem(STORAGE_GUEST_USER_ID)
}

export function formatGuestTrialLabel(trial: TrialInfo): string {
  const remaining = trial.messages_remaining
  if (remaining <= 0) return "Sign in to continue"
  if (remaining === 1) return "1 free message left this week"
  if (remaining >= trial.messages_limit) return "Try Copilot free"
  return `${remaining} free messages left this week`
}

export async function ensureGuestSession(): Promise<GuestSessionResponse> {
  const existing = getStoredGuestToken()
  const res = await fetch(chatApiPath("/guest/session"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(existing ? { guest_token: existing } : {}),
  })

  const raw = await res.json().catch(() => ({}))
  const payload = unwrapChatPayload<
    GuestSessionResponse & { error?: string; code?: string; trial?: TrialInfo }
  >(raw)

  if (!res.ok) {
    throw new GuestChatError(
      payload.error || `guest session failed ${res.status}`,
      res.status,
      payload.code ?? (raw as { code?: string }).code,
      payload.trial ?? (raw as { trial?: TrialInfo }).trial
    )
  }

  storeGuestSession(payload)
  return payload
}

export async function mergeGuestAccount(
  userJWT: string,
  sessionIds?: string[]
): Promise<AccountMergeResponse | null> {
  const guestToken = getStoredGuestToken()
  const guestUserId = getStoredGuestUserId()
  if (!guestToken || !guestUserId) return null

  const res = await fetch(chatApiPath("/account/merge"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJWT}`,
    },
    body: JSON.stringify({
      guest_user_id: guestUserId,
      guest_token: guestToken,
      ...(sessionIds?.length ? { session_ids: sessionIds } : {}),
    }),
  })

  const raw = await res.json().catch(() => ({}))
  const payload = unwrapChatPayload<
    AccountMergeResponse & { error?: string; code?: string }
  >(raw)

  if (!res.ok) {
    throw new GuestChatError(
      payload.error || `guest merge failed ${res.status}`,
      res.status,
      payload.code ?? (raw as { code?: string }).code
    )
  }

  clearGuestStorage()
  return payload
}
