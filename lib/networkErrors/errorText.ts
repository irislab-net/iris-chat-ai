/** Lightweight error text extraction — no serialization of large objects. */
export function readErrorCode(error: unknown): string | null {
  if (error == null || typeof error !== "object") return null
  const o = error as { code?: unknown; name?: unknown }
  if (o.code != null) return String(o.code)
  if (typeof o.name === "string" && o.name) return o.name
  return null
}

export function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error != null && typeof error === "object") {
    const o = error as { message?: unknown; reason?: unknown }
    if (typeof o.message === "string") return o.message
    if (typeof o.reason === "string") return o.reason
  }
  return String(error)
}

export function readHttpStatus(error: unknown, hintStatus?: number): number | null {
  if (hintStatus != null && hintStatus > 0) return hintStatus
  if (error != null && typeof error === "object") {
    const o = error as { status?: unknown; statusCode?: unknown }
    if (typeof o.status === "number") return o.status
    if (typeof o.statusCode === "number") return o.statusCode
    const info = (error as { info?: { response?: { statusCode?: number } } }).info
    const sc = info?.response?.statusCode
    if (typeof sc === "number") return sc
  }
  return null
}
