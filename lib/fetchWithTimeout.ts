/**
 * `fetch` with a wall-clock timeout. If `signal` is passed, aborting it also
 * aborts the request (in addition to the timeout).
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 25_000, signal: outerSignal, ...rest } = init
  const controller = new AbortController()
  const timerId = window.setTimeout(() => controller.abort(), timeoutMs)

  const onOuterAbort = () => controller.abort()
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort()
    else outerSignal.addEventListener("abort", onOuterAbort, { once: true })
  }

  try {
    return await fetch(input, { ...rest, signal: controller.signal })
  } finally {
    window.clearTimeout(timerId)
    outerSignal?.removeEventListener("abort", onOuterAbort)
  }
}
