/** Marks errors already reported via `captureStakingNetworkError` (suppress duplicate global capture). */
const REPORTED_KEY = "__stakingNetworkErrorReported"

export function markErrorReportedToStakingSentry(error: unknown): void {
  if (error == null || typeof error !== "object") return
  try {
    Object.defineProperty(error, REPORTED_KEY, {
      value: true,
      enumerable: false,
      configurable: true,
    })
  } catch {
    /* frozen error objects */
  }
}

export function wasErrorReportedToStakingSentry(error: unknown): boolean {
  return (
    error != null &&
    typeof error === "object" &&
    (error as Record<string, unknown>)[REPORTED_KEY] === true
  )
}
