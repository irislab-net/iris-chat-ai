import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import {
  stakingPassiveMinIntervalElapsed,
  STAKING_PASSIVE_INDEXER_MIN_INTERVAL_MS,
} from "@/staking/notifications"
import {
  createStakingToastDedupeKey,
  stakingToastDedupeFingerprint,
  stakingToastError,
  stakingToastInfo,
  stakingToastWarning,
} from "@/staking/ui"
import { summarizeStakingIndexerToast } from "@/lib/stakingUserFacingErrors"
import { useEffect, useRef } from "react"

/**
 * Side-effect toasts for staking indexer/history fetch issues.
 * Wrong-network passive toast is owned by `useStakingVault` (canonical dedupe id).
 */
export function StakingAppErrorSurface() {
  const {
    runtimeWalletConnected,
    isWrongNetwork,
    stakingHistoryIndexerError,
  } = useStakingVault()

  const lastIndexerToastKey = useRef<string | null>(null)
  const lastIndexerPassiveEmitAtRef = useRef<number | null>(null)

  useEffect(() => {
    const raw = (stakingHistoryIndexerError ?? "").trim()
    if (!raw || !runtimeWalletConnected) {
      if (!raw) {
        lastIndexerToastKey.current = null
        lastIndexerPassiveEmitAtRef.current = null
      }
      return
    }
    if (isWrongNetwork) {
      lastIndexerToastKey.current = null
      lastIndexerPassiveEmitAtRef.current = null
      return
    }

    const fp = stakingToastDedupeFingerprint(raw)
    if (lastIndexerToastKey.current === fp) return

    const now = Date.now()
    if (
      !stakingPassiveMinIntervalElapsed(
        now,
        lastIndexerPassiveEmitAtRef.current,
        STAKING_PASSIVE_INDEXER_MIN_INTERVAL_MS
      )
    ) {
      return
    }

    lastIndexerPassiveEmitAtRef.current = now
    lastIndexerToastKey.current = fp

    const { title, description } = summarizeStakingIndexerToast(raw, false)
    const dedupeId = createStakingToastDedupeKey(
      "history",
      "indexer_activity",
      fp
    )

    const t = title.toLowerCase()
    if (
      t.includes("throttl") ||
      t.includes("rate limit") ||
      t.includes("rate limited")
    ) {
      stakingToastWarning(title, {
        description,
        dedupeId,
      })
      return
    }
    if (t.includes("not configured")) {
      stakingToastInfo(title, {
        description,
        dedupeId,
      })
      return
    }
    stakingToastError(title, {
      description,
      dedupeId,
    })
  }, [runtimeWalletConnected, isWrongNetwork, stakingHistoryIndexerError])

  return null
}
