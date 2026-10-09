import {
  getProfitManagerStatusSnapshot,
  refetchProfitManagerStatusSingleton,
  subscribeProfitManagerStatus,
} from "@/staking/profit"
import { useCallback, useSyncExternalStore } from "react"

export type { ProfitManagerStatus } from "@/lib/stakingVaultFirestoreProfitStatus"

export function useProfitManagerStatus() {
  const s = useSyncExternalStore(
    subscribeProfitManagerStatus,
    getProfitManagerStatusSnapshot,
    getProfitManagerStatusSnapshot
  )

  const refetch = useCallback(() => {
    refetchProfitManagerStatusSingleton()
  }, [])

  return {
    data: s.data,
    loading: s.loading,
    error: s.error,
    serverOffsetMs: 0,
    refetch,
    hasEverFetchedSuccessfully: s.hasEverFetchedSuccessfully,
  }
}
