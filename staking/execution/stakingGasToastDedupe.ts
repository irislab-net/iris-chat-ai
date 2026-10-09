import {
  createStakingToastDedupeKey,
  stakingToastWarning,
} from "@/staking/ui"
import { useEffect, useRef } from "react"

export type StakingGasToastInput = {
  /** When `false`, no gas warning toasts (e.g. Tron runtime). Default `true`. */
  enabled?: boolean
  isConnected: boolean
  vaultDataReady: boolean
  isWrongNetwork: boolean
  nearZeroEth: boolean
  estimateSuccess: boolean
  insufficientNative: boolean
  txInFlight: boolean
}

/**
 * Rising-edge toast dispatcher for gas-related warnings.
 *
 * Phase 3 — passive surface: uses `stakingToastWarning` + `gas:*` dedupe ids (aligned with
 * `stakingPassiveNotificationPolicy` philosophy; no raw Sonner).
 *
 * Pattern: store the last-fired key in a ref; only fire when the key changes.
 * Guarantees no toast on a re-render alone, and one toast per user-perceivable
 * transition into a warning state.
 *
 * Pattern is the canonical template for every other toast in the surface;
 * mirror it (lastKeyRef + computeKey + early-return on equality).
 */
export function useStakingGasToastDedupe(input: StakingGasToastInput): void {
  const {
    enabled = true,
    isConnected,
    vaultDataReady,
    isWrongNetwork,
    nearZeroEth,
    estimateSuccess,
    insufficientNative,
    txInFlight,
  } = input

  const lastKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      lastKeyRef.current = null
      return
    }
    if (
      !isConnected ||
      !vaultDataReady ||
      isWrongNetwork ||
      txInFlight
    ) {
      lastKeyRef.current = null
      return
    }

    let key: string | null = null
    if (nearZeroEth) {
      key = "nearZeroEth"
    } else if (estimateSuccess && insufficientNative) {
      key = "insufficientNative"
    }

    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    if (key === "nearZeroEth" || key === "insufficientNative") {
      const gasEvent =
        key === "nearZeroEth" ? "near_zero_eth" : "insufficient_native"
      stakingToastWarning("Low ETH for network fees", {
        description: "Add ETH to continue.",
        dedupeId: createStakingToastDedupeKey("gas", gasEvent),
      })
      return
    }
  }, [
    enabled,
    isConnected,
    vaultDataReady,
    isWrongNetwork,
    nearZeroEth,
    estimateSuccess,
    insufficientNative,
    txInFlight,
  ])
}
