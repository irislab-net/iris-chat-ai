import {
  traceTxMobilePipeline,
  type TxMobilePipelineStage,
} from "@/staking/diagnostics/stakingTxMobileDeepLinkTrace"

/**
 * DEV-only tracing for mobile staking tx modal / deep-link races.
 * Prefer `traceTxMobilePipeline` for new instrumentation; this wrapper keeps legacy call sites working.
 */
export function stakingTxLifecycleDev(
  event: string,
  detail?: Record<string, unknown>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  traceTxMobilePipeline(event as TxMobilePipelineStage | string, {
    ...detail,
    legacyEvent: true,
  })
}
