import { useAppKitHookReadyGuard } from "@/hooks/useAppKitHookReadyGuard"
import { useTelegramEscalation } from "@/contexts/TelegramEscalationContext"
import { dispatchAppKitOnUserGesture } from "@/lib/wallet/dispatchAppKitOnUserGesture"
import { noteWalletFreshConnectGesture } from "@/lib/wallet/walletAccountIdentityOrchestrator"
import { isMobileWalletUserAgent } from "@/lib/wallet/evmSignerHydration"
import {
  markWalletConnectDeepLinkAttempt,
  runWalletConnectPostOpenPrecheck,
} from "@/lib/wallet/walletConnectSessionRecovery"
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
} from "@reown/appkit/react"
import { useCallback, useMemo } from "react"

function useWallet() {
  useAppKitHookReadyGuard("useWallet")
  const { open: appKitOpen } = useAppKit()
  const { caipNetwork, chainId } = useAppKitNetwork()
  const { address, isConnected, status } = useAppKitAccount()
  const escalation = useTelegramEscalation()

  /**
   * "Connect Wallet" entry point used by every call site. Inside the Telegram
   * in-app browser (declared unsupported), this re-opens the unsupported-
   * environment notice instead of invoking AppKit — there is no continue-
   * anyway path. Everywhere else, this is a thin wrapper over AppKit's `open`.
   */
  const open = useCallback(() => {
    if (escalation.isUnsupportedEnvironment) {
      escalation.openNotice()
      return
    }
    dispatchAppKitOnUserGesture(() => {
      noteWalletFreshConnectGesture("useWallet.open")
      if (isMobileWalletUserAgent()) {
        markWalletConnectDeepLinkAttempt("useWallet.open")
        appKitOpen()
        void runWalletConnectPostOpenPrecheck("useWallet.open")
        return
      }
      markWalletConnectDeepLinkAttempt("useWallet.open")
      appKitOpen()
      void runWalletConnectPostOpenPrecheck("useWallet.open")
    })
  }, [escalation, appKitOpen])

  const isLoading = useMemo(() => status === "connecting", [status])

  const shortAddress = useMemo(
    () => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""),
    [address]
  )

  /** Any EVM chain (mainnet, Sepolia, etc.) — required for multi-chain EIP-155 wallets. */
  const isEthereumNetwork = useMemo(() => {
    if (!address) return false

    return caipNetwork?.chainNamespace === "eip155"
  }, [address, caipNetwork?.chainNamespace])

  return {
    network: caipNetwork,
    chainId,
    address,
    isEthereumNetwork,
    shortAddress,
    isConnected,
    isLoading,
    open,
  }
}

export default useWallet
