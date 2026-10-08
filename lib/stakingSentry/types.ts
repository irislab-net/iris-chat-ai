/** Canonical tag keys applied to every structured staking Sentry event. */
export type StakingCanonicalTags = Readonly<{
  wallet_vendor?: string | null
  chain_family?: string | null
  deployment_id?: string | null
  runtime_key?: string | null
  blocking_gate?: string | null
  tx_scenario?: string | null
  tx_phase?: string | null
  ui_phase?: string | null
  mobile?: string | null
  browser?: string | null
  visibility_state?: string | null
  signer_state?: string | null
  runtime_hydration?: string | null
  execution_connected?: string | null
  execution_network_ok?: string | null
  appkit_connected?: string | null
  wrong_network?: string | null
  reconnecting?: string | null
  provider_type?: string | null
  session_type?: string | null
  release?: string | null
  environment?: string | null
  app_build_id?: string | null
  vite_build_hash?: string | null
  runtime_asset_version?: string | null
  rpc_host?: string | null
  rpc_transport?: string | null
  rpc_chain_id?: string | null
  endpoint_type?: string | null
  network_error_type?: string | null
}>

export type StakingRuntimeContext = Readonly<Record<string, string | boolean | number | null>>
export type StakingWalletContext = Readonly<Record<string, string | boolean | number | null>>
export type StakingTxContext = Readonly<Record<string, string | boolean | number | null>>
export type StakingHydrationContext = Readonly<Record<string, string | boolean | number | null>>
export type StakingVisibilityContext = Readonly<Record<string, string | boolean | number | null>>
export type StakingNetworkContext = Readonly<Record<string, string | boolean | number | null>>
export type StakingProviderContext = Readonly<Record<string, string | boolean | number | null>>
export type StakingAsyncContext = Readonly<Record<string, string | boolean | number | null>>
export type StakingMobileContext = Readonly<Record<string, string | boolean | number | null>>

export type StakingStructuredContexts = Readonly<{
  staking_runtime?: StakingRuntimeContext
  staking_wallet?: StakingWalletContext
  staking_tx?: StakingTxContext
  staking_hydration?: StakingHydrationContext
  staking_visibility?: StakingVisibilityContext
  staking_network?: StakingNetworkContext
  staking_provider?: StakingProviderContext
  staking_async?: StakingAsyncContext
  staking_mobile?: StakingMobileContext
}>

/** Legacy tag shape — kept for gradual migration at call sites. */
export type StakingSentryTagContext = Readonly<{
  walletProvider?: string | null
  runtimeFamily?: string | null
  deploymentId?: string | null
  txPhase?: string | null
  signerHydration?: string | null
  runtimeReconcile?: string | null
  networkMismatch?: boolean | null
}>
