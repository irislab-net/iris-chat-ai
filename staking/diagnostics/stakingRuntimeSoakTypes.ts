import type { ChainFamily } from "@/staking/core/types"

export type StakingRuntimeSoakEventType =
  | "runtime_swap"
  | "network_change"
  | "wallet_connect"
  | "wallet_disconnect"
  | "vault_ready"
  | "vault_not_ready"
  | "contamination_disconnect"
  | "hydration_stall"
  | "transition_churn"
  | "identity_drift"

export type RuntimeSoakHealth = "stable" | "warming" | "degraded" | "unstable"

export type StakingRuntimeSoakSample = Readonly<{
  runtimeKey: string
  generation: number
  chainFamily: ChainFamily
  sequenceStage: string
  lifecycle: string
  vaultDataReady: boolean
  runtimeWalletConnected: boolean
  executionConnected: boolean
  isWrongNetwork: boolean
  canTransact: boolean
  runtimeWalletAddress?: string | null
  executionAddress?: string | null
}>

export type StakingRuntimeSoakTimelineEvent = Readonly<{
  atMs: number
  type: StakingRuntimeSoakEventType
  runtimeKey: string
  generation: number
  chainFamily: ChainFamily
  detail?: Record<string, unknown>
}>
