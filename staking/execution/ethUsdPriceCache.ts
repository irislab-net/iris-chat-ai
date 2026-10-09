/**
 * Shared singleton for Chainlink ETH/USD used ONLY by staking fee presentation.
 *
 * - Decoupled from `estimateStakingGasFee` / gas cache keys / tx execution.
 * - Low-frequency refresh (30–120s), visibility-aware, inflight-deduped.
 * - Subscribers: `useSyncExternalStore` from `useStakingEthUsdPresentation`.
 */
import { STAKING_CHAIN_ID } from "@/constants/stakingVaultConfig"
import { resolveChainlinkEthUsdFeedAddress } from "@/constants/ethUsdChainlinkFeeds"
import {
  DEBUG_LOGS,
  getEthUsdFeedStaleThresholdSec,
  readEthUsdCachePollTtlMs,
} from "@/staking/config"
import { logger } from "@/lib/logger"
import type { EthUsdFeedPresentation } from "@/staking/execution"
import { readChainlinkEthUsdLatest, type EthUsdFeedRead } from "@/services/ethUsdFeed"

const listeners = new Set<() => void>()

let presentation: EthUsdFeedPresentation = { kind: "none" }
let revision = 0
/** Last good read for stale-safe fallback when RPC fails. */
let lastSuccessfulRead: (EthUsdFeedRead & { staleFlag: boolean }) | null = null

let inflight: Promise<void> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let subscriberCount = 0

function staleThresholdSec(): bigint {
  return getEthUsdFeedStaleThresholdSec()
}

function devCacheLog(message: string, data?: Record<string, unknown>) {
  if (!DEBUG_LOGS) return
  logger.log(`[ethUsdCache] ${message}`, data ?? "")
}

function emit() {
  for (const l of listeners) l()
}

function setPresentation(next: EthUsdFeedPresentation) {
  const same =
    presentation.kind === next.kind &&
    (next.kind === "none" ||
      (presentation.kind === "live" &&
        next.kind === "live" &&
        presentation.answer === next.answer &&
        presentation.feedDecimals === next.feedDecimals &&
        presentation.stale === next.stale))
  if (same) return
  presentation = Object.freeze(next)
  revision += 1
  emit()
}

function nowSec(): bigint {
  return BigInt(Math.floor(Date.now() / 1000))
}

function computeStale(read: EthUsdFeedRead): boolean {
  const age = nowSec() - read.updatedAt
  return age > staleThresholdSec()
}

function toPresentation(read: EthUsdFeedRead, stale: boolean): EthUsdFeedPresentation {
  return Object.freeze({
    kind: "live",
    answer: read.answer,
    feedDecimals: read.feedDecimals,
    stale,
  })
}

async function runFetch(reason: string, force: boolean): Promise<void> {
  const feed = resolveChainlinkEthUsdFeedAddress(STAKING_CHAIN_ID)
  if (!feed) {
    devCacheLog("unsupported_chain", { chainId: STAKING_CHAIN_ID, reason })
    setPresentation({ kind: "none" })
    return
  }

  const ac = new AbortController()
  const read = await readChainlinkEthUsdLatest({ feedAddress: feed, signal: ac.signal })
  if (!read) {
    devCacheLog("rpc_failed", { reason, fallback: Boolean(lastSuccessfulRead) })
    if (lastSuccessfulRead) {
      const staleNow = computeStale(lastSuccessfulRead)
      setPresentation(toPresentation(lastSuccessfulRead, staleNow || lastSuccessfulRead.staleFlag))
    } else {
      setPresentation({ kind: "none" })
    }
    return
  }

  const stale = computeStale(read)
  lastSuccessfulRead = { ...read, staleFlag: stale }
  setPresentation(toPresentation(read, stale))
  devCacheLog("refresh_ok", {
    reason,
    force,
    stale,
    rev: revision,
    updatedAt: read.updatedAt.toString(),
  })
}

/**
 * Single-flight refresh for the staking chain feed. Never touches gas caches.
 */
export function refreshStakingEthUsdPrice(input: {
  reason: string
  force?: boolean
}): Promise<void> {
  if (inflight && !input.force) return inflight

  const p = (async () => {
    try {
      await runFetch(input.reason, Boolean(input.force))
    } finally {
      inflight = null
    }
  })()
  inflight = p
  return p
}

function onVisibility() {
  if (typeof document === "undefined") return
  if (document.visibilityState !== "visible") return
  void refreshStakingEthUsdPrice({ reason: "visibility" })
}

function startTransport() {
  if (pollTimer !== null) return
  void refreshStakingEthUsdPrice({ reason: "subscribe", force: true })
  pollTimer = setInterval(() => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return
    void refreshStakingEthUsdPrice({ reason: "interval" })
  }, readEthUsdCachePollTtlMs())
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility)
  }
}

function stopTransport() {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibility)
  }
}

export function subscribeStakingEthUsdPresentation(listener: () => void): () => void {
  listeners.add(listener)
  subscriberCount += 1
  if (subscriberCount === 1) startTransport()
  return () => {
    listeners.delete(listener)
    subscriberCount -= 1
    if (subscriberCount <= 0) {
      subscriberCount = 0
      stopTransport()
    }
  }
}

export function getStakingEthUsdPresentation(): EthUsdFeedPresentation {
  return presentation
}

export function getStakingEthUsdRevision(): number {
  return revision
}
