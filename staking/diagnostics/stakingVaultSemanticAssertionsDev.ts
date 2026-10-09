import { isDevConsoleLoggingEnabled } from "@/staking/diagnostics/stakingDevConsole"
import type { ChainFamily } from "@/staking/core/types"

export type StakingVaultSemanticSnapshot = Readonly<{
  runtimeKey: string
  chainFamily: ChainFamily
  executionChainId: number | null
  executionNetworkOk: boolean
  canTransact: boolean
  runtimeWalletConnected: boolean
  runtimeWalletAddress: string | null | undefined
  executionAddress: string | null | undefined
  runtimeWalletNetworkOk: boolean
}>

const warned = new Set<string>()

function devSemanticWarn(code: string, detail: Record<string, unknown>): void {
  if (!(process.env.NODE_ENV !== 'production') || !isDevConsoleLoggingEnabled()) return
  if (warned.has(code)) return
  warned.add(code)
  console.warn(`[staking-vault][semantic] ${code}`, detail)
}

/**
 * DEV-only invariant checks for runtime vs execution plane separation. Never throws.
 */
export function runStakingVaultSemanticAssertionsDev(
  s: StakingVaultSemanticSnapshot
): void {
  if (!(process.env.NODE_ENV !== 'production') || !isDevConsoleLoggingEnabled()) return

  if (s.chainFamily === "tron") {
    if (s.executionChainId !== null) {
      devSemanticWarn("tron_execution_chain_id_must_be_null", {
        runtimeKey: s.runtimeKey,
        executionChainId: s.executionChainId,
      })
    }
    if (s.executionNetworkOk) {
      devSemanticWarn("tron_execution_network_ok_must_be_false", {
        runtimeKey: s.runtimeKey,
      })
    }
    if (s.canTransact) {
      devSemanticWarn("tron_can_transact_must_be_false", {
        runtimeKey: s.runtimeKey,
      })
    }
    if (s.runtimeWalletConnected && !s.runtimeWalletNetworkOk) {
      devSemanticWarn("tron_connected_implies_network_ok", {
        runtimeKey: s.runtimeKey,
        runtimeWalletAddress: s.runtimeWalletAddress ?? null,
      })
    }
    return
  }

  if (s.chainFamily === "evm" && s.runtimeWalletConnected) {
    const runtimeAddr = s.runtimeWalletAddress?.trim() ?? ""
    const execAddr = s.executionAddress?.trim() ?? ""
    if (runtimeAddr !== execAddr) {
      devSemanticWarn("evm_runtime_address_must_match_execution_when_connected", {
        runtimeKey: s.runtimeKey,
        runtimeWalletAddress: runtimeAddr || null,
        executionAddress: execAddr || null,
      })
    }
  }
}
