import { useTransactionStatus } from "@/components/pages/staking/TransactionStatusContext"
import {
  deriveStakingActiveTransactionAwareness,
  type StakingActiveTransactionAwareness,
} from "@/staking/tx/stakingActiveTransactionAwareness"
import { useMemo } from "react"

/**
 * Memoized ambient tx awareness from the authoritative provider snapshot.
 * Subscribe only where subtle pending indicators are rendered.
 */
export function useStakingActiveTransactionAwareness(): StakingActiveTransactionAwareness {
  const { snapshot } = useTransactionStatus()
  return useMemo(
    () => deriveStakingActiveTransactionAwareness(snapshot),
    [snapshot]
  )
}
