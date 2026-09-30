const WEB_SESSION_SALT = "exur-ai"

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  )
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function newWebSessionId(userId: string): Promise<string> {
  const prefix = (await sha256Hex(userId + WEB_SESSION_SALT)).slice(0, 32)
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  const suffix = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
  return prefix + suffix
}

export async function isValidWebSessionId(
  userId: string,
  sessionId: string
): Promise<boolean> {
  if (!userId || sessionId.length !== 40) return false
  const prefix = (await sha256Hex(userId + WEB_SESSION_SALT)).slice(0, 32)
  if (sessionId.slice(0, 32) !== prefix) return false
  return /^[0-9a-f]{8}$/.test(sessionId.slice(32))
}

/** After account merge: same 8-char suffix, prefix for the registered user. */
export async function reboundWebSessionId(
  registeredUserId: string,
  guestSessionId: string
): Promise<string | null> {
  if (
    !/^[0-9a-f]{8}$/.test(guestSessionId.slice(32)) ||
    guestSessionId.length !== 40
  ) {
    return null
  }
  const prefix = (await sha256Hex(registeredUserId + WEB_SESSION_SALT)).slice(
    0,
    32
  )
  return prefix + guestSessionId.slice(32)
}
