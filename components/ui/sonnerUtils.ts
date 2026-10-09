import { cn } from "@/lib/utils"

/** Root class names for tx lifecycle custom toasts — shell comes from global Sonner glass CSS. */
export function buildStakingTxLifecycleToastClassName(modifiers: {
  shine?: boolean
  success?: boolean
  failed?: boolean
}): string {
  return cn(
    "staking-tx-lifecycle-toast",
    modifiers.shine && "staking-tx-lifecycle-toast--shine",
    modifiers.success && "staking-tx-lifecycle-toast--success",
    modifiers.failed && "staking-tx-lifecycle-toast--failed"
  )
}
