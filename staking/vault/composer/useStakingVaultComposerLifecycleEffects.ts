import type { StakingVaultComposerLifecycleRefs } from "@/staking/vault/composer/useStakingVaultComposerRefs"
import { useEffect } from "react"

export type UseStakingVaultComposerLifecycleEffectsInput = Readonly<{
  lifecycleRefs: StakingVaultComposerLifecycleRefs
}>

/** Mount lifecycle ref — register before refresh plane (sequencing-sensitive). */
export function useStakingVaultComposerLifecycleEffects(
  input: UseStakingVaultComposerLifecycleEffectsInput
): void {
  const { lifecycleRefs } = input
  const { isMountedRef } = lifecycleRefs

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
}
