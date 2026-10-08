/**
 * DEV-only ordered timeline for mobile wallet tx / deep-link handoff debugging.
 * Production: inert (no console, no globals).
 */
import {
  isDevConsoleLoggingEnabled,
  stakingDevConsoleDebug,
} from "@/staking/diagnostics/stakingDevConsole"

export type TxMobilePipelineStage =
  | "cta_press"
  | "preview_open"
  | "preview_confirm_click"
  | "awaiting_signature_enter"
  | "flow_runner_start"
  | "begin_preparing_transaction"
  | "end_preparing_transaction"
  | "signer_request"
  | "signer_resolved"
  | "signer_failed"
  | "wallet_sendTransaction_start"
  | "wallet_sendTransaction_end"
  | "wallet_sendTransaction_rejected"
  | "appkit_open_wallet_request"
  | "appkit_wallet_modal_open"
  | "visibility_hidden"
  | "visibility_visible"
  | "pagehide"
  | "pageshow"
  | "window_focus"
  | "window_blur"
  | "tx_hash_received"
  | "publish_tx_broadcast"
  | "set_confirming"
  | "stale_submission_skip"
  | "retry_requested"
  | "retry_blocked_submit_in_flight"
  | "retry_blocked_nonce_deduped"
  | "flow_runner_armed"
  | "unlock_idle_closed"
  | "set_failed"
  | "modal_open_change"
  | "legacy_dev_event"

/** Stall hypothesis buckets from trace timeline (A–G). */
export type TxMobileStallHypothesis =
  | "A_signer_never_resolves"
  | "B_sendTransaction_never_called"
  | "C_sendTransaction_wallet_ui_never_opens"
  | "D_deep_link_resume_breaks"
  | "E_wallet_return_promise_hung"
  | "F_tx_hash_lifecycle_stuck"
  | "G_retry_blocked_stale_refs"
  | "unknown"

export type TxMobileTraceEntry = Readonly<{
  atMs: number
  perfMs: number
  stage: TxMobilePipelineStage | string
  submissionId: number | null
  scenario: string | null
  form: string | null
  uiPhase: string | null
  txPhase: string | null
  detail: Record<string, unknown>
}>

const TIMELINE_CAP = 140

const timeline: TxMobileTraceEntry[] = []

let attemptContext: Readonly<{
  submissionId: number | null
  scenario: string | null
  form: string | null
}> = {
  submissionId: null,
  scenario: null,
  form: null,
}

let snapshotContext: Readonly<{
  uiPhase: string | null
  dialogOpen: boolean | null
}> = {
  uiPhase: null,
  dialogOpen: null,
}

function devOnly(): boolean {
  return isDevConsoleLoggingEnabled()
}

export function traceTxMobileSetAttemptContext(
  ctx: Partial<typeof attemptContext>
): void {
  if (!devOnly()) return
  attemptContext = { ...attemptContext, ...ctx }
}

export function traceTxMobileSetSnapshotContext(
  ctx: Partial<typeof snapshotContext>
): void {
  if (!devOnly()) return
  snapshotContext = { ...snapshotContext, ...ctx }
}

export function traceTxMobilePipeline(
  stage: TxMobilePipelineStage | string,
  detail: Record<string, unknown> = {}
): void {
  if (!devOnly()) return
  const perfMs = typeof performance !== "undefined" ? performance.now() : 0
  const enrichedDetail: Record<string, unknown> = { ...detail }
  const stageName = String(stage)
  const sendStartIndex = lastStageIndex("wallet_sendTransaction_start")
  const sendStart = sendStartIndex >= 0 ? timeline[sendStartIndex] : null
  if (
    sendStart &&
    (stageName === "visibility_hidden" ||
      stageName === "visibility_visible" ||
      stageName === "pageshow" ||
      stageName === "pagehide")
  ) {
    enrichedDetail.msSinceWalletSendTransactionStart = Math.round(
      perfMs - sendStart.perfMs
    )
  }
  if (stageName === "wallet_sendTransaction_start" && !hasStage("flow_runner_start")) {
    enrichedDetail.orderGuard = "wallet_dispatch_before_flow_runner_start"
  }
  const entry: TxMobileTraceEntry = {
    atMs: Date.now(),
    perfMs,
    stage,
    submissionId: attemptContext.submissionId,
    scenario: attemptContext.scenario,
    form: attemptContext.form,
    uiPhase: snapshotContext.uiPhase,
    txPhase:
      typeof enrichedDetail.txPhase === "string"
        ? enrichedDetail.txPhase
        : typeof enrichedDetail.uiPhase === "string"
          ? enrichedDetail.uiPhase
          : snapshotContext.uiPhase,
    detail: enrichedDetail,
  }
  timeline.push(entry)
  if (timeline.length > TIMELINE_CAP) {
    timeline.splice(0, timeline.length - TIMELINE_CAP)
  }
  stakingDevConsoleDebug(`[staking-tx-mobile] ${stage}`, entry)
}

export function dumpTxMobilePipelineTimeline(): readonly TxMobileTraceEntry[] {
  return [...timeline]
}

export function clearTxMobilePipelineTimeline(): void {
  timeline.length = 0
}

function hasStage(...stages: string[]): boolean {
  return timeline.some(e => stages.includes(String(e.stage)))
}

function lastStageIndex(stage: string): number {
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    if (timeline[i]?.stage === stage) return i
  }
  return -1
}

/** Infer where the pipeline likely stopped (read-only analysis). */
export function inferTxMobileStallHypothesis(): TxMobileStallHypothesis {
  if (hasStage("retry_blocked_submit_in_flight", "retry_blocked_nonce_deduped")) {
    return "G_retry_blocked_stale_refs"
  }

  const sendStart = lastStageIndex("wallet_sendTransaction_start")
  const sendEnd = lastStageIndex("wallet_sendTransaction_end")
  const hashIdx = lastStageIndex("tx_hash_received")

  if (hashIdx >= 0 && sendEnd >= 0 && !hasStage("set_confirming", "publish_tx_broadcast")) {
    return "F_tx_hash_lifecycle_stuck"
  }

  if (sendStart >= 0 && sendEnd < 0) {
    const hiddenAfterSend =
      lastStageIndex("visibility_hidden") > sendStart ||
      lastStageIndex("pagehide") > sendStart
    if (hiddenAfterSend && lastStageIndex("visibility_visible") < sendStart) {
      return "E_wallet_return_promise_hung"
    }
    if (hiddenAfterSend) {
      return "D_deep_link_resume_breaks"
    }
    return "C_sendTransaction_wallet_ui_never_opens"
  }

  if (
    hasStage("awaiting_signature_enter", "flow_runner_start") &&
    !hasStage("wallet_sendTransaction_start")
  ) {
    if (hasStage("signer_failed") || !hasStage("signer_resolved")) {
      return "A_signer_never_resolves"
    }
    return "B_sendTransaction_never_called"
  }

  return "unknown"
}

export function installTxMobilePipelineTraceGlobal(): void {
  if (!devOnly() || typeof window === "undefined") return
  const w = window as typeof window & {
    __STAKING_TX_MOBILE_TRACE__?: {
      dump: () => readonly TxMobileTraceEntry[]
      infer: () => TxMobileStallHypothesis
      clear: () => void
    }
  }
  w.__STAKING_TX_MOBILE_TRACE__ = {
    dump: dumpTxMobilePipelineTimeline,
    infer: inferTxMobileStallHypothesis,
    clear: clearTxMobilePipelineTimeline,
  }
}
