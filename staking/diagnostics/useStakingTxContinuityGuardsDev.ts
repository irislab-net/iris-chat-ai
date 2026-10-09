import { stakingTxIntegrityDev } from "@/staking/diagnostics/stakingTxIntegrityDev"
import {
  auditStakingTxContinuitySnapshot,
  type StakingTxContinuityHealAction,
} from "@/staking/tx/stakingTxContinuityGuards"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { useEffect, useRef } from "react"

const HEAL_COOLDOWN_MS = 2_000

export type StakingTxContinuityGuardsDevInput = Readonly<{
  snapshot: TransactionStatusSnapshot
  onHeal: (action: StakingTxContinuityHealAction) => void
}>

/**
 * DEV-only regression guards for tx continuity. Production: no-op.
 */
export function useStakingTxContinuityGuardsDev(
  input: StakingTxContinuityGuardsDevInput
): void {
  const onHealRef = useRef(input.onHeal)
  onHealRef.current = input.onHeal
  const lastHealAtRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return

    const audit = auditStakingTxContinuitySnapshot(input.snapshot)
    if (audit.violations.length === 0) return

    const sig = audit.violations.join("|")
    stakingTxIntegrityDev("continuity_guard_violation", {
      violations: audit.violations,
      uiPhase: input.snapshot.uiPhase,
      dialogOpen: input.snapshot.dialogOpen,
      scenario: input.snapshot.scenario,
    })

    const now = Date.now()
    for (const heal of audit.heals) {
      const last = lastHealAtRef.current[heal] ?? 0
      if (now - last < HEAL_COOLDOWN_MS) continue
      lastHealAtRef.current[heal] = now
      stakingTxIntegrityDev("continuity_guard_heal", { action: heal, sig })
      onHealRef.current(heal)
    }
  }, [
    input.snapshot.dialogOpen,
    input.snapshot.uiPhase,
    input.snapshot.scenario,
    input.snapshot.approveTxHash,
    input.snapshot.depositTxHash,
    input.snapshot.withdrawTxHash,
    input.snapshot.txHash,
    input.snapshot.approveWirePhase,
    input.snapshot.depositWirePhase,
    input.snapshot.withdrawWirePhase,
  ])
}
