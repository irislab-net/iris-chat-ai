import type { User } from "@/lib/api/types"
import { pickUserDisplayName } from "@/lib/user-profile"

type UserLike = Partial<User> & Record<string, unknown>

const AVATAR_URL_KEYS = [
  "profile_image_url",
  "x_profile_image_url",
  "picture",
  "avatar_url",
  "photo_url",
  "google_profile_image_url",
] as const

function pickAvatarUrl(raw: UserLike): string | null {
  for (const key of AVATAR_URL_KEYS) {
    const value = raw[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return null
}

export function resolveUserAvatarUrl(
  user: User | null | undefined
): string | null {
  if (!user) return null
  return pickAvatarUrl(user as UserLike)
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === "function") {
    const data = new TextEncoder().encode(input)
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  }

  const { createHash } = await import("node:crypto")
  return createHash("sha256").update(input).digest("hex")
}

export async function gravatarUrlFromEmail(
  email: string,
  size = 128
): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const hash = await sha256Hex(normalized)
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}

export async function resolveUserAvatarUrlWithFallback(
  user: User | null | undefined
): Promise<string | null> {
  const direct = resolveUserAvatarUrl(user)
  if (direct) return direct

  const email = user?.email?.trim()
  if (!email) return null
  return gravatarUrlFromEmail(email)
}

export function normalizeUser(raw: unknown): User {
  const source =
    raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).user ??
        (raw as Record<string, unknown>).data ??
        raw)
      : raw

  const user = source as User
  const avatarUrl = pickAvatarUrl(user as UserLike)
  const displayName = pickUserDisplayName(user as UserLike)

  return {
    ...user,
    profile_image_url: avatarUrl,
    x_profile_image_url: user.x_profile_image_url?.trim() || avatarUrl || "",
    x_name: user.x_name?.trim() || displayName || "",
  }
}
