import type { StakingCtaReasonModel } from "@/types/stakingCtaReason"
import type { StakingCtaUiPhase } from "@/lib/stakingUiPhase"
import type { StakingCtaTxPhase } from "@/types/stakingCtaTxPhase"
import { STAKING_CTA_ENTER_AMOUNT_MESSAGE } from "@/constants/stakingCtaShortLabels"
const TERMINAL_TX: ReadonlySet<StakingCtaTxPhase> = new Set([
  "failed",
  "cancelled",
  "confirmed",
])

const ACTIVE_UI: ReadonlySet<StakingCtaUiPhase> = new Set([
  "preview",
  "preparing_transaction",
  "submitted",
  "confirming",
  "approving",
  "depositing",
  "withdrawing",
])

/**
 * Trims end whitespace, removes a single trailing ASCII "...", returns base for animated dots.
 */
export function stripTrailingAsciiEllipsis(text: string): {
  base: string
  hadEllipsis: boolean
} {
  const trimmedEnd = text.replace(/\s+$/, "")
  if (!trimmedEnd.endsWith("...")) {
    return { base: text, hadEllipsis: false }
  }
  const baseTrimmed = trimmedEnd.slice(0, -3)
  const trailingWs = text.slice(trimmedEnd.length)
  return { base: baseTrimmed + trailingWs, hadEllipsis: true }
}

/** Plain one-line string for staking CTA reason (message + optional hint). */
export function getStakingCtaReasonDisplayLine(
  raw: StakingCtaReasonModel | null
): string {
  if (raw == null) return ""
  const msg = raw.message.trim()
  if (msg === "") return ""
  const hint = raw.hint?.trim()
  return hint ? `${msg} — ${hint}` : msg
}

/**
 * Primary CTA label: animate trailing dots only during in-flight / preparation UI,
 * or when the label itself ends with "..." on a non-terminal tx (e.g. connecting wallet).
 */
export function shouldAnimateStakingPrimaryEllipsis(input: {
  uiPhase: StakingCtaUiPhase
  ctaTxPhase: StakingCtaTxPhase
  successLockActive: boolean
  ctaLabel: string
}): boolean {
  if (input.successLockActive) return false
  if (TERMINAL_TX.has(input.ctaTxPhase)) return false
  if (input.uiPhase === "success") return false

  if (ACTIVE_UI.has(input.uiPhase)) {
    return stripTrailingAsciiEllipsis(input.ctaLabel).hadEllipsis
  }

  if (input.uiPhase === "idle" || input.uiPhase === "ready") {
    if (!stripTrailingAsciiEllipsis(input.ctaLabel).hadEllipsis) return false
    const t = input.ctaLabel.trim()
    if (/^ready\b/i.test(t)) return false
    return true
  }

  return false
}

/** Inline reason row: neutral loading / wallet nudges with trailing "...". */
export function shouldAnimateStakingReasonEllipsis(
  reason: StakingCtaReasonModel | null,
  uiPhase: StakingCtaUiPhase
): boolean {
  if (!reason || reason.tone === "red") return false
  if (reason.message === STAKING_CTA_ENTER_AMOUNT_MESSAGE) return false
  if (uiPhase === "success") return false
  const line = getStakingCtaReasonDisplayLine(reason)
  return stripTrailingAsciiEllipsis(line).hadEllipsis
}
