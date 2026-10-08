/**
 * Lightweight bridge: mobile resume / tx modal can request signer re-hydration
 * without importing React hooks from `useEtheriumWallet`.
 */

let bumpHydration: (() => void) | null = null
let resetHydrationAttempts: (() => void) | null = null

let lastRequestAtMs = 0
const REQUEST_DEBOUNCE_MS = 280

export function registerEvmSignerHydrationRecovery(input: Readonly<{
  bump: (() => void) | null
  resetAttempts?: (() => void) | null
}>): void {
  bumpHydration = input.bump
  resetHydrationAttempts = input.resetAttempts ?? null
}

/** Idempotent nudge — debounced; resets attempt budget before re-run. */
export function requestEvmSignerHydrationRecovery(reason: string): void {
  void reason
  const now = Date.now()
  if (now - lastRequestAtMs < REQUEST_DEBOUNCE_MS) return
  lastRequestAtMs = now
  resetHydrationAttempts?.()
  bumpHydration?.()
}
