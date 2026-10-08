/**
 * CFG2/3 — runtime-safe getters + env-backed deployment rows re-exported for staking call sites (no new logic).
 */
export {
  getExpectedChainId,
  readViteStakingHighNetworkFeeWei,
  readViteStakingTermsUrl,
  STAKING_CHAIN_ID,
  STAKING_DEPLOYMENTS_JSON,
  STAKING_EXPLORER_BASE_URL,
  STAKING_EXPLORER_LABEL,
  STAKING_NETWORK_LABEL,
  STAKING_RPC_HTTP_URL,
  STAKING_RPC_WS_URL,
  STAKING_TOKEN_ADDRESS,
  STAKING_TRON_CAIP2,
  STAKING_TRON_EXPLORER_BASE_URL,
  STAKING_TRON_RPC_HTTP_URL,
  STAKING_TRON_TOKEN_ADDRESS,
  STAKING_TRON_TX_HISTORY_GRID_API_URL,
  STAKING_TRON_VAULT_ADDRESS,
  STAKING_VAULT_ADDRESS,
} from "@/config/env"
export {
  getEthUsdFeedStaleThresholdSec,
  LEGACY_EVM_NATIVE_CURRENCY,
  readEthUsdCachePollTtlMs,
  STAKING_ETH_CAIP2_PREFIX,
  STAKING_ETH_CHAIN_FAMILY,
  stakingEvmExplorerDisplayName,
  stakingEvmNetworkDisplayName,
  STAKING_ETH_USD_CACHE_POLL_TTL_MS,
} from "@/staking/config/stakingEthConfig"

export {
  EXPLICIT_TRON_ENV_EXPLORER_DISPLAY_NAME,
  EXPLICIT_TRON_ENV_NETWORK_DISPLAY_NAME,
  EXPLICIT_TRON_ROW_CAIP2_WHEN_ENV_UNSET,
  STAKING_TRON_CHAIN_FAMILY,
} from "@/staking/config/stakingTronConfig"
