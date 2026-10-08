import type { NormalizedNetworkError } from "@/lib/networkErrors/types"

/** Rolling window for WS reconnect-loop detection (avoids counter-only false positives). */
const WS_RECONNECT_WINDOW_MS = 60_000
const WS_RECONNECT_LOOP_MIN_ATTEMPTS = 4

const wsReconnectTimestamps: number[] = []
let lastWsReconnectLoopNormalized: NormalizedNetworkError | null = null

export function recordWsReconnectAttempt(now = Date.now()): void {
  wsReconnectTimestamps.push(now)
  const cutoff = now - WS_RECONNECT_WINDOW_MS
  while (wsReconnectTimestamps.length > 0 && wsReconnectTimestamps[0]! < cutoff) {
    wsReconnectTimestamps.shift()
  }
  if (wsReconnectTimestamps.length > 16) {
    wsReconnectTimestamps.splice(0, wsReconnectTimestamps.length - 16)
  }
}

export function isWsReconnectLoopInWindow(now = Date.now()): boolean {
  const cutoff = now - WS_RECONNECT_WINDOW_MS
  let count = 0
  for (let i = wsReconnectTimestamps.length - 1; i >= 0; i--) {
    if (wsReconnectTimestamps[i]! >= cutoff) {
      count++
      if (count >= WS_RECONNECT_LOOP_MIN_ATTEMPTS) return true
    }
  }
  return false
}

export function setLastWsReconnectLoopNormalized(normalized: NormalizedNetworkError | null): void {
  lastWsReconnectLoopNormalized = normalized
}

export function getLastWsReconnectLoopNormalized(): NormalizedNetworkError | null {
  return lastWsReconnectLoopNormalized
}

export function resetWsReconnectWindowForTests(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  wsReconnectTimestamps.length = 0
  lastWsReconnectLoopNormalized = null
}
