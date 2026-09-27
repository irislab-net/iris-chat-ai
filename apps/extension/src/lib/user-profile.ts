import type { User } from "@/lib/api/types"

type UserLike = Partial<User> & Record<string, unknown>

const DISPLAY_NAME_KEYS = [
  "x_name",
  "name",
  "display_name",
  "full_name",
  "google_name",
] as const

function pickString(raw: UserLike, key: string): string | null {
  const value = raw[key]
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }
  return null
}

export function pickUserDisplayName(raw: UserLike): string | null {
  for (const key of DISPLAY_NAME_KEYS) {
    const value = pickString(raw, key)
    if (value) return value
  }

  const given = pickString(raw, "given_name") ?? ""
  const family = pickString(raw, "family_name") ?? ""
  const fromGoogleParts = [given, family].filter(Boolean).join(" ")
  if (fromGoogleParts) return fromGoogleParts

  const first = pickString(raw, "first_name") ?? ""
  const last = pickString(raw, "last_name") ?? ""
  const fromNameParts = [first, last].filter(Boolean).join(" ")
  if (fromNameParts) return fromNameParts

  return null
}

export function resolveUserDisplayName(
  user: User | null | undefined
): string | null {
  if (!user) return null
  return pickUserDisplayName(user as UserLike)
}

export function userAccountLabel(user: User | null | undefined): string {
  if (!user) return "Account"

  const displayName = resolveUserDisplayName(user)
  if (displayName) return displayName

  const username = user.x_username?.trim()
  if (username) return `@${username}`

  const email = user.email?.trim()
  if (email) return email

  return "Account"
}

export function userAccountSubline(
  user: User | null | undefined
): string | null {
  if (!user) return null

  const headline = userAccountLabel(user)
  const email = user.email?.trim()
  if (email && email !== headline) return email

  const username = user.x_username?.trim()
  if (username && `@${username}` !== headline) return `@${username}`

  return null
}

export function userAvatarFallback(user: User | null | undefined): string {
  const source = userAccountLabel(user).replace(/^@/, "")
  const parts = source.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}
