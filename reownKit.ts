import { EthersAdapter } from "@reown/appkit-adapter-ethers"
import { TronAdapter } from "@reown/appkit-adapter-tron"
import { createAppKit, modal as appKitModal } from "@reown/appkit/react"
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapter-tronlink"
import { REOWN_PROJECT_ID } from "@/config/env"
import {
  APP_METADATA_DESCRIPTION,
  APP_METADATA_NAME,
} from "@/staking/config/stakingUiConfig"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
import {
  resolveWalletConnectIconUrl,
  resolveWalletConnectMetadataUrl,
  resolveWalletConnectRedirectUniversal,
} from "@/lib/walletConnectAppMetadata"
import { buildReownAppKitNetworksAndDefault } from "@/lib/wallet/appKitStakingNetworks"
import type { AppKit } from "@reown/appkit/react"

/**
 * WalletConnect v2 `metadata.redirect` tells signing wallets where to send the
 * user after they approve the request. Wallets pass this through their deep-
 * link / universal-link handler so the dApp WebView regains focus.
 */
const metadataUrl = resolveWalletConnectMetadataUrl()

const metadata = {
  name: APP_METADATA_NAME,
  description: APP_METADATA_DESCRIPTION,
  url: metadataUrl,
  icons: [resolveWalletConnectIconUrl(metadataUrl)],
  redirect: {
    universal: resolveWalletConnectRedirectUniversal(),
  },
}

export const ethersAdapter = new EthersAdapter()

const tronAdapter = new TronAdapter({
  walletAdapters: [
    new TronLinkAdapter({
      openUrlWhenWalletNotFound: false,
      checkTimeout: 3_000,
    }),
  ],
})

const ethEnabled = isRuntimeFamilyEnabled("evm")
const tronEnabled = isRuntimeFamilyEnabled("tron")

const adapters = [
  ...(ethEnabled ? [ethersAdapter] : []),
  ...(tronEnabled ? [tronAdapter] : []),
  ...(ethEnabled || tronEnabled ? [] : [ethersAdapter]),
] as const

const { networks, defaultNetwork } = buildReownAppKitNetworksAndDefault()

let appKitCommitted = false

/** Whether `createAppKit()` has run synchronously in this session. */
export function isReownAppKitCommitted(): boolean {
  return appKitCommitted
}

/**
 * Synchronous singleton commit — called only from `initializeAppKit()`.
 * Must complete before any `useAppKit*` hook runs.
 */
export function commitReownAppKit(): AppKit {
  if (appKitCommitted) {
    return appKitModal!
  }
  if (!REOWN_PROJECT_ID.trim()) {
    console.warn(
      "[reownKit] NEXT_PUBLIC_REOWN_PROJECT_ID is empty — WalletConnect cloud config will fail until set."
    )
  }
  createAppKit({
    adapters: [...adapters],
    networks: networks as [typeof defaultNetwork, ...typeof networks],
    defaultNetwork,
    projectId: REOWN_PROJECT_ID || "00000000000000000000000000000000",
    metadata,
    features: {
      analytics: false,
      socials: false,
      email: false,
      swaps: false,
      onramp: false,
      receive: false,
      send: false,
    },
    themeVariables: {
      "--w3m-z-index": 1000,
    },
  })
  appKitCommitted = true
  return appKitModal!
}

/** After `initializeAppKit()` resolves — used by WC recovery (no separate import path). */
export function getReownAppKitModal(): AppKit {
  if (!appKitCommitted) {
    throw new Error("reown_appkit_not_committed")
  }
  return appKitModal!
}
