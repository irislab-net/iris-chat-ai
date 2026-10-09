/**
 * SSR-safe UUID v4 helper for environments where `crypto.randomUUID` is missing
 * (older iOS webviews, Trust Wallet, partial Web Crypto implementations).
 */

function randomUuidFromBytes(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function randomUuidTimestampFallback(): string {
  const rand = Math.random().toString(16).slice(2, 14).padEnd(12, "0")
  const time = Date.now().toString(16).padStart(12, "0").slice(-12)
  return `00000000-0000-4000-8000-${time}${rand}`.slice(0, 36)
}

function randomUuidWithoutNative(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return randomUuidFromBytes()
  }
  return randomUuidTimestampFallback()
}

/** Preferred UUID for app code — never throws when `randomUUID` is absent. */
export function safeRandomUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return randomUuidWithoutNative()
}

/**
 * Minimal polyfill for third-party SDKs (Firebase App Check) that call `crypto.randomUUID`
 * directly. Only assigns when missing; does not replace a working implementation.
 */
export function ensureCryptoRandomUuidPolyfill(): void {
  if (typeof crypto === "undefined") return
  if (typeof crypto.randomUUID === "function") return
  crypto.randomUUID = randomUuidWithoutNative as () => `${string}-${string}-${string}-${string}-${string}`
}
