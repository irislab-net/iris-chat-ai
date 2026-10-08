import { STAKING_APPKIT_NETWORK } from "@/constants/stakingVaultConfig"
import { stakingSentryBreadcrumb } from "@/lib/stakingSentryObservability"
import { dispatchAppKitOnUserGesture } from "@/lib/wallet/dispatchAppKitOnUserGesture"
import { noteWalletFreshConnectGesture } from "@/lib/wallet/walletAccountIdentityOrchestrator"
import { isMobileWalletUserAgent } from "@/lib/wallet/evmSignerHydration"
import {
  markWalletConnectDeepLinkAttempt,
  runWalletConnectPostOpenPrecheck,
} from "@/lib/wallet/walletConnectSessionRecovery"
import { traceTxMobilePipeline } from "@/staking/diagnostics/stakingTxMobileDeepLinkTrace"
import { resolveTronAppKitNetworkFromCaip2 } from "@/lib/wallet/appKitStakingNetworks"
import { markStakingConnectIntent } from "@/staking/diagnostics/stakingTrustWalletConnectDebug"
import type { CaipNetwork, ChainNamespace } from "@reown/appkit-common"
import type { OpenOptions, Views } from "@reown/appkit/react"
import { requestPassiveTronNetworkSwitch } from "@/staking/identity/tron/tronWalletIdentity"

export type UnifiedWalletRuntimeNamespace = Extract<ChainNamespace, "eip155" | "tron">

export type UnifiedWalletAppKitClient = Readonly<{
  open: <V extends Views>(options?: OpenOptions<V>) => Promise<unknown>
  switchNetwork: (network: CaipNetwork) => Promise<void>
}>

/** Map deployment CAIP-2 to an AppKit network row registered in `reownKit.ts`. */
export function resolveAppKitCaipNetworkForDeployment(input: Readonly<{
  deploymentCaip2: string
  namespace: UnifiedWalletRuntimeNamespace
}>): CaipNetwork | undefined {
  if (input.namespace === "eip155") {
    return STAKING_APPKIT_NETWORK as unknown as CaipNetwork
  }
  return resolveTronAppKitNetworkFromCaip2(input.deploymentCaip2)
}

/**
 * Mobile: sync `appKit.open()` on gesture stack, async WC precheck after.
 * Desktop: microtask may await precheck before open (Lit-safe).
 */
function openAppKitOnGesture(
  source: string,
  openFn: () => void | Promise<unknown>
): void {
  dispatchAppKitOnUserGesture(() => {
    const runOpen = async () => {
      try {
        await openFn()
      } catch {
        /* AppKit open rejected — precheck may still run */
      }
      void runWalletConnectPostOpenPrecheck(source)
    }

    if (isMobileWalletUserAgent()) {
      markWalletConnectDeepLinkAttempt(source)
      void runOpen()
      return
    }
    void (async () => {
      markWalletConnectDeepLinkAttempt(source)
      await runOpen()
    })()
  })
}

/**
 * Open AppKit connect modal for the active runtime namespace.
 */
export function openUnifiedWallet(input: Readonly<{
  appKit: UnifiedWalletAppKitClient
  namespace: UnifiedWalletRuntimeNamespace
  connected?: boolean
  wrongNetwork?: boolean
}>): void {
  if (input.wrongNetwork) {
    openAppKitOnGesture("openUnifiedWallet:Networks", () => {
      markStakingConnectIntent("openUnifiedWallet:Networks")
      stakingSentryBreadcrumb("wallet_modal_open", {
        view: "Networks",
        namespace: input.namespace,
        wrong_network: true,
      })
      traceTxMobilePipeline("appkit_wallet_modal_open", {
        view: "Networks",
        namespace: input.namespace,
      })
      return input.appKit.open({ view: "Networks", namespace: input.namespace })
    })
    return
  }
  if (input.connected) {
    openAppKitOnGesture("openUnifiedWallet:Account", () => {
      markStakingConnectIntent("openUnifiedWallet:Account")
      stakingSentryBreadcrumb("wallet_modal_open", {
        view: "Account",
        namespace: input.namespace,
      })
      traceTxMobilePipeline("appkit_wallet_modal_open", {
        view: "Account",
        namespace: input.namespace,
      })
      return input.appKit.open({ view: "Account", namespace: input.namespace })
    })
    return
  }
  openAppKitOnGesture("openUnifiedWallet:Connect", () => {
    noteWalletFreshConnectGesture("openUnifiedWallet:Connect")
    markStakingConnectIntent("openUnifiedWallet:Connect")
    stakingSentryBreadcrumb("connect_clicked", { namespace: input.namespace })
    stakingSentryBreadcrumb("wallet_modal_open", {
      view: "Connect",
      namespace: input.namespace,
    })
    traceTxMobilePipeline("appkit_wallet_modal_open", {
      view: "Connect",
      namespace: input.namespace,
    })
    return input.appKit.open({ view: "Connect", namespace: input.namespace })
  })
}

/** Open AppKit account view (connected wallet menu). */
export function openUnifiedAccountView(input: Readonly<{
  appKit: UnifiedWalletAppKitClient
  namespace: UnifiedWalletRuntimeNamespace
}>): void {
  openAppKitOnGesture("openUnifiedAccountView", () =>
    input.appKit.open({ view: "Account", namespace: input.namespace })
  )
}

/**
 * Request network switch via AppKit; passive TronLink switch only when AppKit path fails.
 */
export async function requestUnifiedNetworkSwitch(input: Readonly<{
  appKit: UnifiedWalletAppKitClient
  namespace: UnifiedWalletRuntimeNamespace
  deploymentCaip2: string
}>): Promise<boolean> {
  const network = resolveAppKitCaipNetworkForDeployment({
    deploymentCaip2: input.deploymentCaip2,
    namespace: input.namespace,
  })

  if (network) {
    try {
      await input.appKit.switchNetwork(network)
      return true
    } catch {
      /* AppKit switch rejected or unavailable — fall through */
    }
  }

  if (input.namespace === "tron") {
    const passiveOk = await requestPassiveTronNetworkSwitch(input.deploymentCaip2)
    if (passiveOk) return true
  }

  openAppKitOnGesture("requestUnifiedNetworkSwitch:Networks", () =>
    input.appKit.open({ view: "Networks", namespace: input.namespace })
  )
  return false
}
