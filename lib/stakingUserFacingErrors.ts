/**
 * Maps explorer API, wallet, and contract errors to short copy for Sonner.
 * Raw JSON-RPC / HTTP error bodies must not appear in the staking UI.
 */

import { STAKING_CHAIN_ID, STAKING_NETWORK_LABEL } from "@/constants/stakingVaultConfig"
import type { NormalizedNetworkError } from "@/lib/networkErrors/types"
import { normalizeNetworkError } from "@/lib/networkErrors/normalizeNetworkError"

/** When the wallet is not on the staking chain, prefer this over RPC-style copy. */
export function summarizeStakingIndexerToast(
  raw: string,
  isWrongNetwork: boolean
): {
  title: string
  description?: string
} {
  const t = raw.trim()
  if (isWrongNetwork && t.length > 0) {
    return {
      title: "Wrong network",
      description: `Use ${STAKING_NETWORK_LABEL} (chain ${STAKING_CHAIN_ID}) to load activity.`,
    }
  }
  return summarizeStakingHistoryIndexerError(raw)
}

export function summarizeNormalizedNetworkError(normalized: NormalizedNetworkError): {
  title: string
  description?: string
} {
  switch (normalized.type) {
    case "RATE_LIMIT":
      return {
        title: "Activity rate limited",
        description: "Explorer limit reached. Try again shortly.",
      }
    case "CORS_OR_NETWORK_BLOCKED":
    case "RPC_UNREACHABLE":
    case "DNS_FAILURE":
    case "API_NETWORK_ERROR":
    case "INDEXER_UNAVAILABLE":
      return {
        title: "Connection issue",
        description: "Check your network and retry.",
      }
    case "CHAIN_MISMATCH":
      return {
        title: "Wrong network",
        description: `Use ${STAKING_NETWORK_LABEL} (chain ${STAKING_CHAIN_ID}) to load activity.`,
      }
    default:
      return summarizeStakingHistoryIndexerError(normalized.originalMessage)
  }
}

/** Classify raw indexer/API copy via centralized normalizer (string-only call sites). */
export function summarizeStakingHistoryIndexerErrorFromRaw(
  raw: string,
  isWrongNetwork: boolean
): { title: string; description?: string } {
  if (isWrongNetwork && raw.trim().length > 0) {
    return summarizeStakingIndexerToast(raw, true)
  }
  const normalized = normalizeNetworkError(new Error(raw), {
    endpointType: "indexer",
    transport: "http",
    chainId: STAKING_CHAIN_ID,
    severity: "silent",
  })
  return summarizeNormalizedNetworkError(normalized)
}

export function summarizeStakingHistoryIndexerError(raw: string): {
  title: string
  description?: string
} {
  const t = raw.trim()
  const lower = t.toLowerCase()

  if (!lower) {
    return {
      title: "Activity unavailable",
      description: "Try again shortly.",
    }
  }

  if (
    lower.includes("vite_staking_tx_history_origin") ||
    lower.includes("staking transaction history api is not configured")
  ) {
    return {
      title: "Activity feed not configured",
      description: "Set VITE_STAKING_TX_HISTORY_ORIGIN in the site environment.",
    }
  }

  if (
    lower.includes("etherscan api key is not configured") ||
    lower.includes("vite_etherscan_api_key")
  ) {
    return {
      title: "Activity feed not configured",
      description: "Set VITE_ETHERSCAN_API_KEY in the site environment.",
    }
  }

  if (
    lower.includes("invalid api key") ||
    lower.includes("notok") && lower.includes("api key")
  ) {
    return {
      title: "Explorer key rejected",
      description: "Verify VITE_ETHERSCAN_API_KEY and key permissions.",
    }
  }

  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("max rate limit")
  ) {
    return {
      title: "Activity rate limited",
      description: "Explorer limit reached. Try again shortly.",
    }
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed")
  ) {
    return {
      title: "Connection issue",
      description: "Check your network and retry.",
    }
  }

  return {
    title: "Activity unavailable",
    description: "Try again shortly.",
  }
}

export function summarizeAffiliateHistoryError(): {
  title: string
  description?: string
} {
  return {
    title: "Affiliate activity unavailable",
    description: "Refresh or try again shortly.",
  }
}
