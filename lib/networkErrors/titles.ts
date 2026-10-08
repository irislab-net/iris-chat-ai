import type { NetworkErrorType } from "@/lib/networkErrors/types"

const TITLES: Readonly<Record<NetworkErrorType, string>> = {
  RPC_UNREACHABLE: "[RPC_UNREACHABLE] Ethereum RPC unavailable",
  DNS_FAILURE: "[DNS_FAILURE] RPC host DNS resolution failed",
  RPC_TIMEOUT: "[RPC_TIMEOUT] RPC request timeout",
  WS_DISCONNECTED: "[WS_DISCONNECTED] WebSocket connection lost",
  WS_RECONNECT_LOOP: "[WS_RECONNECT_LOOP] WebSocket reconnect loop detected",
  CORS_OR_NETWORK_BLOCKED: "[CORS_OR_NETWORK_BLOCKED] Network request blocked",
  INVALID_RPC_RESPONSE: "[INVALID_RPC_RESPONSE] Invalid JSON-RPC payload",
  RPC_4XX: "[RPC_4XX] RPC client request rejected",
  RPC_5XX: "[RPC_5XX] RPC server internal error",
  API_4XX: "[API_4XX] Backend API client error",
  API_5XX: "[API_5XX] Backend API server error",
  RATE_LIMIT: "[RATE_LIMIT] Endpoint rate limited",
  PROVIDER_UNAVAILABLE: "[PROVIDER_UNAVAILABLE] RPC provider unavailable",
  CHAIN_MISMATCH: "[CHAIN_MISMATCH] Wallet network mismatch",
  WALLETCONNECT_INVALID_SESSION: "[WALLETCONNECT_INVALID_SESSION] WalletConnect session invalid",
  WALLETCONNECT_STALE_SESSION: "[WALLETCONNECT_STALE_SESSION] WalletConnect session stale",
  MISSING_RESPONSE: "[MISSING_RESPONSE] Empty RPC or API response",
  ABORTED_REQUEST: "[ABORTED_REQUEST] Request aborted",
  INDEXER_UNAVAILABLE: "[INDEXER_UNAVAILABLE] Transaction history endpoint unavailable",
  API_NETWORK_ERROR: "[API_NETWORK_ERROR] Failed to reach backend API",
  CALL_EXCEPTION: "[CALL_EXCEPTION] Contract call reverted",
}

export function titleForNetworkErrorType(type: NetworkErrorType): string {
  return TITLES[type]
}
