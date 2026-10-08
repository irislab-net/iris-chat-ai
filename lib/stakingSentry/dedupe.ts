/**
 * Session-scoped dedupe + cooldown windows — prevents Sentry flood from stalls and polls.
 */

const reportedKeys = new Set<string>()
const lastEmitAt = new Map<string, number>()

const DEFAULT_COOLDOWN_MS = 120_000

const EVENT_COOLDOWN_MS: Readonly<Record<string, number>> = {
  "staking.runtime.connect_stalled": 600_000,
  "staking.runtime.vault_tx_loading_stalled": 300_000,
  "staking.tx.awaiting_signature_stalled": 300_000,
  "staking.hydration.reconcile_failure": 120_000,
  "staking.refresh.orchestrator_starvation": 120_000,
  "staking.refresh.balance_wall_stall": 180_000,
  "staking.async.commit_denied": 45_000,
  "staking.performance.modal_phase_stall": 120_000,
  "staking.invariant.disabled_family_participating": 600_000,
  "staking.network.rpc_degradation": 90_000,
  "staking.network.rpc_failure": 90_000,
  "staking.network.indexer_failure": 60_000,
  "staking.network.api_failure": 60_000,
  "staking.network.websocket_failure": 120_000,
  "staking.network.wallet_session_failure": 120_000,
  "staking.provider.reconnect_loop": 120_000,
}

export function shouldEmitStakingSentryEvent(input: Readonly<{
  dedupeKey: string
  eventName?: string
  cooldownMs?: number
  oncePerSession?: boolean
}>): boolean {
  const now = Date.now()
  const key = input.dedupeKey

  if (input.oncePerSession !== false && reportedKeys.has(key)) {
    return false
  }

  const cd =
    input.cooldownMs ??
    (input.eventName ? EVENT_COOLDOWN_MS[input.eventName] : undefined) ??
    DEFAULT_COOLDOWN_MS

  const last = lastEmitAt.get(key) ?? 0
  if (now - last < cd) {
    return false
  }

  if (input.oncePerSession !== false) {
    reportedKeys.add(key)
  }
  lastEmitAt.set(key, now)
  return true
}

export function resetStakingSentryDedupeForTests(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  reportedKeys.clear()
  lastEmitAt.clear()
}
