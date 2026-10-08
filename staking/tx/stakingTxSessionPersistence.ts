/**
 * sessionStorage-backed snapshot of the staking transaction modal so a reload
 * or WebView restore can rehydrate in-flight UX. Cleared on idle, mismatch, or TTL.
 *
 * **Phase 29:** nested **`snapshot.transactionRuntime`** (when present on in-memory / JSON rows) pins
 * reconcile + explorer to the runtime frozen at flow start — no session **version** bump; absent field
 * keeps legacy hydrate behavior.
 *
 * ## v2 writes (EVM-only, transitional)
 *
 * - Optional **`ENABLE_STAKING_TX_SESSION_V2_WRITE`** (default **false**): when **true**, stores a
 *   **`PersistedStakingTxSessionV2`** envelope under the **same** sessionStorage key.
 * - **Read path** always dual-parses v2 → **v1-compatible** rows for `TransactionStatusProvider` —
 *   restore/hydrate/reconcile semantics stay on the v1-shaped surface.
 * - **`accountId` in v2 storage is not authoritative for all flows yet** — restore matching uses
 *   `sessionMatchesAccount`: prefers **`hydratedSessionAccountId`** (from v2→v1 dual-read only) vs
 *   live-derived EVM `accountId`, then **falls back** to legacy `sessionMatchesWallet`
 *   (`walletAddress` + numeric `chainId`) so Ethereum behavior stays migration-safe.
 * - **Tron:** not supported; v2 builder returns null → **v1 write fallback**.
 */
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP } from "@/staking/tx/types/transactionStatusUiPhase"
import {
  isPersistedUserRejectionSnapshot,
  normalizeSubmissionTerminalFields,
} from "@/staking/tx/stakingTxSubmissionTerminal"
import { createIdleTransactionStatusSnapshot } from "@/staking/tx/transactionStatusSnapshotHelpers"
import { getExpectedChainId } from "@/staking/config"
import { STAKING_ETH_CHAIN_FAMILY } from "@/staking/config/stakingEthConfig"
import { stakingLifecycleTrace } from "@/staking/diagnostics"
import { createEvmAddressCodec } from "@/staking/core/address"
import type { ChainFamily } from "@/staking/core/types"
import { getDefaultDeploymentId } from "@/staking/core/getDefaultDeploymentId"

export const STAKING_TX_SESSION_STORAGE_KEY = "waddle_staking_tx_session_v1"

/**
 * When **true**, persist `PersistedStakingTxSessionV2` for valid EVM rows; otherwise unchanged v1 JSON.
 * Keep **false** in production until rollout is validated.
 */
export const ENABLE_STAKING_TX_SESSION_V2_WRITE = false

export type PersistedStakingTxSessionV1 = {
  v: 1
  updatedAt: number
  /** Wallet that owned this session when last persisted */
  walletAddress: string | null
  /** AppKit / vault chain id when last persisted */
  chainId: number | null
  snapshot: TransactionStatusSnapshot
  /**
   * Present **only** when this row was rebuilt from a v2 envelope via dual-read — holds the v2
   * `accountId` string for `sessionMatchesAccount`. **Never** read from raw legacy v1 JSON (strip
   * on parse) so arbitrary sessionStorage cannot spoof identity.
   */
  hydratedSessionAccountId?: string | null
}

/**
 * Forward persistence schema. Written only when `ENABLE_STAKING_TX_SESSION_V2_WRITE` is **true**
 * and the EVM codec path succeeds; otherwise callers still store v1.
 */
export type PersistedStakingTxSessionV2 = {
  v: 2
  updatedAt: number
  deploymentId: string
  caip2: string
  chainFamily: ChainFamily
  accountId: string
  walletAddressRaw?: string | null
  snapshot: TransactionStatusSnapshot
}

/** Abandoned sessions older than this are dropped on read. */
export const STAKING_TX_SESSION_TTL_MS = 48 * 60 * 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPersistedStakingTxSessionV1(o: Record<string, unknown>): o is PersistedStakingTxSessionV1 {
  return (
    o.v === 1 &&
    typeof o.updatedAt === "number" &&
    (o.walletAddress === null || typeof o.walletAddress === "string") &&
    (o.chainId === null || typeof o.chainId === "number") &&
    o.snapshot !== null &&
    typeof o.snapshot === "object"
  )
}

function isPersistedStakingTxSessionV2(o: Record<string, unknown>): o is PersistedStakingTxSessionV2 {
  if (o.v !== 2) return false
  if (typeof o.updatedAt !== "number") return false
  if (typeof o.deploymentId !== "string" || o.deploymentId.trim() === "") return false
  if (typeof o.caip2 !== "string" || o.caip2.trim() === "") return false
  if (o.chainFamily !== "evm" && o.chainFamily !== "tron") return false
  if (typeof o.accountId !== "string" || o.accountId.trim() === "") return false
  if (o.walletAddressRaw !== undefined && o.walletAddressRaw !== null && typeof o.walletAddressRaw !== "string") {
    return false
  }
  return o.snapshot !== null && typeof o.snapshot === "object"
}

/**
 * Maps a v2 row into the v1 shape consumed by TransactionStatusProvider + wallet match helpers.
 * Returns null when the row cannot be represented for legacy EVM restore (e.g. Tron-only v2).
 */
export function persistedTxSessionV2ToV1Compatible(
  row: PersistedStakingTxSessionV2
): PersistedStakingTxSessionV1 | null {
  if (row.chainFamily !== "evm") return null

  const caip2 = row.caip2.trim()
  const m = /^eip155:(\d+)$/i.exec(caip2)
  const chainId = m ? Number(m[1]) : null
  if (chainId === null || !Number.isFinite(chainId)) return null

  const hexAddr = /^0x[a-fA-F0-9]{40}$/i
  let wallet: string | null = row.walletAddressRaw?.trim() ?? null
  if (wallet && !hexAddr.test(wallet)) wallet = null
  if (!wallet) {
    const am = /^eip155:\d+:(0x[a-fA-F0-9]{40})$/i.exec(row.accountId.trim())
    wallet = am?.[1] ?? null
  }
  if (!wallet) return null

  return {
    v: 1,
    updatedAt: row.updatedAt,
    walletAddress: normalizePersistAddress(wallet),
    chainId,
    snapshot: row.snapshot as TransactionStatusSnapshot,
  }
}

/**
 * Attempts a v2 envelope from a v1-shaped row using the EVM address codec.
 * @param useExpectedChainIdFallback when **true**, uses `getExpectedChainId()` if `row.chainId` is null
 *        (in-memory upgrade helper); when **false**, requires a finite numeric `row.chainId` (session writes).
 */
function tryBuildPersistedStakingTxSessionV2Envelope(
  row: PersistedStakingTxSessionV1,
  opts: { useExpectedChainIdFallback: boolean }
): PersistedStakingTxSessionV2 | null {
  let cidNum: number | null = null
  if (row.chainId !== null && row.chainId !== undefined) {
    const n = Number(row.chainId)
    cidNum = Number.isFinite(n) ? n : null
  }
  if (cidNum === null) {
    if (!opts.useExpectedChainIdFallback) return null
    cidNum = getExpectedChainId()
  }
  const rawWallet = row.walletAddress?.trim()
  if (!rawWallet) return null

  const codec = createEvmAddressCodec()
  const normalized = codec.tryParse(rawWallet)
  if (!normalized) return null

  const caip2 = `eip155:${cidNum}`
  const accountId = codec.toAccountId(normalized, caip2)

  return {
    v: 2,
    updatedAt: row.updatedAt,
    deploymentId: getDefaultDeploymentId(),
    caip2,
    chainFamily: STAKING_ETH_CHAIN_FAMILY,
    accountId,
    walletAddressRaw: row.walletAddress,
    snapshot: row.snapshot,
  }
}

/**
 * Pure helper for in-memory upgrades / tests. Uses `getExpectedChainId()` when `chainId` is absent.
 */
export function upgradeV1ToV2InMemory(
  row: PersistedStakingTxSessionV1
): PersistedStakingTxSessionV2 | null {
  return tryBuildPersistedStakingTxSessionV2Envelope(row, {
    useExpectedChainIdFallback: true,
  })
}

function pickV1RowFromParsed(parsed: PersistedStakingTxSessionV1): PersistedStakingTxSessionV1 {
  return {
    v: 1,
    updatedAt: parsed.updatedAt,
    walletAddress: parsed.walletAddress,
    chainId: parsed.chainId,
    snapshot: parsed.snapshot,
  }
}

/**
 * Dual-read: v2 first, then v1. Always returns the v1 envelope for downstream compatibility.
 */
function parsePersistedRowDual(raw: string | null): PersistedStakingTxSessionV1 | null {
  if (!raw?.trim()) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null

    if (isPersistedStakingTxSessionV2(parsed)) {
      const base = persistedTxSessionV2ToV1Compatible(parsed)
      if (!base) return null
      const aid = typeof parsed.accountId === "string" ? parsed.accountId.trim() : ""
      return aid ? { ...base, hydratedSessionAccountId: aid } : base
    }

    if (isPersistedStakingTxSessionV1(parsed)) {
      return pickV1RowFromParsed(parsed)
    }
    return null
  } catch {
    return null
  }
}

export function readPersistedStakingTxSession(): PersistedStakingTxSessionV1 | null {
  if (typeof sessionStorage === "undefined") return null
  try {
    const row = parsePersistedRowDual(sessionStorage.getItem(STAKING_TX_SESSION_STORAGE_KEY))
    if (!row) return null
    const age = Date.now() - row.updatedAt
    if (age > STAKING_TX_SESSION_TTL_MS) {
      stakingLifecycleTrace("persistence", "session_ttl_expired", { ageMs: age })
      sessionStorage.removeItem(STAKING_TX_SESSION_STORAGE_KEY)
      return null
    }
    return row
  } catch {
    return null
  }
}

export function writePersistedStakingTxSession(row: PersistedStakingTxSessionV1): void {
  if (typeof sessionStorage === "undefined") return
  try {
    const payload: PersistedStakingTxSessionV1 | PersistedStakingTxSessionV2 =
      ENABLE_STAKING_TX_SESSION_V2_WRITE
        ? tryBuildPersistedStakingTxSessionV2Envelope(row, {
            useExpectedChainIdFallback: false,
          }) ?? row
        : row

    sessionStorage.setItem(STAKING_TX_SESSION_STORAGE_KEY, JSON.stringify(payload))
    stakingLifecycleTrace("persistence", "write", {
      phase: row.snapshot.uiPhase,
      chainId: row.chainId,
      hasAddr: Boolean(row.walletAddress),
      persistVersion: payload.v,
    })
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedStakingTxSession(reason: string): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.removeItem(STAKING_TX_SESSION_STORAGE_KEY)
    stakingLifecycleTrace("persistence", "clear", { reason })
  } catch {
    /* ignore */
  }
}

export function isPersistableTxSnapshot(s: TransactionStatusSnapshot): boolean {
  if (s.uiPhase === null || s.uiPhase === "cancelled") return false
  if (TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP.has(s.uiPhase)) return false
  if (!s.dialogOpen) {
    return (
      s.uiPhase === "submitted" ||
      s.uiPhase === "confirming" ||
      s.uiPhase === "awaiting_signature" ||
      s.uiPhase === "pending" ||
      (s.uiPhase === "preview" && s.preparingTransaction)
    )
  }
  return true
}

export function snapshotLooksIdle(s: TransactionStatusSnapshot): boolean {
  return !s.dialogOpen && s.uiPhase === null
}

export function normalizePersistAddress(a: string | null | undefined): string | null {
  if (!a?.trim()) return null
  const t = a.trim()
  // Tron base58 is case-sensitive; never lowercase it for session identity.
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(t)) return t
  return t.toLowerCase()
}

export function sessionMatchesWallet(
  row: PersistedStakingTxSessionV1,
  walletAddress: string | null | undefined,
  chainId: number | null | undefined
): boolean {
  const w = normalizePersistAddress(walletAddress)
  const rw = normalizePersistAddress(row.walletAddress)
  if (w === null || rw === null) return false
  if (w !== rw) return false
  if (row.chainId == null || chainId == null) return false
  return Number(row.chainId) === Number(chainId)
}

/**
 * Derives the same EVM `accountId` string used in v2 persistence (`eip155:{chainId}:{equalityKey}`).
 * Returns null when inputs are unusable — callers must fall back to legacy matching.
 */
function tryDeriveEvmSessionAccountId(
  walletAddress: string | null | undefined,
  chainId: number | null | undefined
): string | null {
  if (chainId == null) return null
  const cid = Number(chainId)
  if (!Number.isFinite(cid)) return null
  const raw = walletAddress?.trim()
  if (!raw) return null
  const codec = createEvmAddressCodec()
  const normalized = codec.tryParse(raw)
  if (!normalized) return null
  const caip2 = `eip155:${cid}`
  return codec.toAccountId(normalized, caip2)
}

/**
 * Account-aware session identity (EVM-only): prefers stable `accountId` equality when the row
 * carries **`hydratedSessionAccountId`** from a v2 dual-read envelope **and** the connected wallet
 * yields a derivable id; otherwise delegates to **`sessionMatchesWallet`** unchanged (lowercase hex
 * + numeric `chainId`).
 *
 * **Why fallback:** during migration most rows are legacy v1 JSON without a trusted account id;
 * codec/chain gaps must never block restore — legacy path remains authoritative when account id
 * matching cannot run.
 */
export function sessionMatchesAccount(
  row: PersistedStakingTxSessionV1,
  walletAddress: string | null | undefined,
  chainId: number | null | undefined
): boolean {
  const persisted = row.hydratedSessionAccountId?.trim()
  if (persisted) {
    const live = tryDeriveEvmSessionAccountId(walletAddress, chainId)
    if (live !== null) {
      return persisted === live
    }
  }
  return sessionMatchesWallet(row, walletAddress, chainId)
}

export function reviveSnapshotFromPersistence(
  row: PersistedStakingTxSessionV1
): TransactionStatusSnapshot {
  const base = row.snapshot
  if (!base || typeof base !== "object") return createIdleTransactionStatusSnapshot()
  return normalizeSubmissionTerminalFields({
    ...createIdleTransactionStatusSnapshot(),
    ...base,
  })
}

export function isHydratablePersistedTxSession(
  row: PersistedStakingTxSessionV1
): boolean {
  if (isPersistedUserRejectionSnapshot(row.snapshot)) return false
  return true
}
