import { traceWalletAccountIdentity } from "@/lib/wallet/walletAccountIdentityTelemetry"

const STORAGE_KEY = "waddle_wallet_manual_disconnect_guard_v1"
/** Suppress stale WC/AppKit auto-restore until user explicitly connects again. */
const GUARD_TTL_MS = 30 * 60 * 1000

export type WalletManualDisconnectGuardRow = Readonly<{
  setAt: number
  previousAddress: string | null
  reason: string
}>

function readRow(): WalletManualDisconnectGuardRow | null {
  if (typeof sessionStorage === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WalletManualDisconnectGuardRow
    if (typeof parsed.setAt !== "number") return null
    if (Date.now() - parsed.setAt > GUARD_TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function readWalletManualDisconnectGuard(): WalletManualDisconnectGuardRow | null {
  return readRow()
}

export function isWalletManualDisconnectGuardActive(): boolean {
  return readRow() != null
}

export function setWalletManualDisconnectGuard(input: Readonly<{
  previousAddress: string | null
  reason: string
}>): WalletManualDisconnectGuardRow {
  const row: WalletManualDisconnectGuardRow = {
    setAt: Date.now(),
    previousAddress: input.previousAddress?.trim().toLowerCase() || null,
    reason: input.reason,
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(row))
  } catch {
    /* private mode */
  }
  return row
}

export function clearWalletManualDisconnectGuard(reason: string): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode */
  }
  traceWalletAccountIdentity("wallet_manual_disconnect_guard_cleared", {
    reason,
  })
}
