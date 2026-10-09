import { useAppKitHookReadyGuard } from "@/hooks/useAppKitHookReadyGuard"
import type { Provider } from "@reown/appkit-adapter-ethers"
import {
  captureStakingException,
  STAKING_SENTRY_EVENT,
  stakingSentryBreadcrumb,
} from "@/lib/stakingSentry"
import {
  isMobileWalletUserAgent,
  isTransientEvmSignerHydrationFailure,
  resolveEvmSignerFromWalletProvider,
} from "@/lib/wallet/evmSignerHydration"
import {
  handleWalletConnectStaleSessionError,
  isWalletConnectStaleSessionError,
} from "@/lib/wallet/walletConnectSessionRecovery"
import { registerEvmSignerHydrationRecovery } from "@/lib/wallet/evmSignerHydrationRecovery"
import {
  traceAccountChangedDetected,
} from "@/lib/wallet/walletAccountIdentityOrchestrator"
import { isWalletHandoffLikely } from "@/staking/orchestration/stakingMobileResumeCoordinator"
import { isStakingTxModalActivityActive } from "@/staking/tx/stakingTxSessionRecoveryPolicy"
import { traceTxMobilePipeline } from "@/staking/diagnostics/stakingTxMobileDeepLinkTrace"
import { traceStakingEvmSignerHydration } from "@/staking/diagnostics/stakingTrustWalletConnectDebug"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { BrowserProvider, Contract, type Signer } from "ethers"
import { useCallback, useEffect, useRef, useState } from "react"

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]

const MAX_SIGNER_HYDRATION_ATTEMPTS = 5

type UseEtheriumWalletOptions = Readonly<{
  /** When false (passive Tron runtime), skip provider/signer lifecycle — AppKit may still be connected. */
  evmRuntimeActive?: boolean
}>

function useEtheriumWallet(options: UseEtheriumWalletOptions = {}) {
  useAppKitHookReadyGuard("useEtheriumWallet")
  const evmRuntimeActive = options.evmRuntimeActive !== false
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" })
  const { walletProvider } = useAppKitProvider<Provider>("eip155")

  const isEthereumNetwork = Boolean(
    evmRuntimeActive && isConnected && address?.trim()
  )

  const [provider, setProvider] = useState<BrowserProvider>()
  const [signer, setSigner] = useState<Signer>()
  const [hydrationEpoch, setHydrationEpoch] = useState(0)

  const hydrationAttemptsRef = useRef(0)
  const hydrationSessionRef = useRef<string | null>(null)
  const hydrationRunGenRef = useRef(0)

  const resetHydrationAttempts = useCallback(() => {
    hydrationAttemptsRef.current = 0
  }, [])

  const bumpHydrationEpoch = useCallback(() => {
    setHydrationEpoch(n => n + 1)
  }, [])

  useEffect(() => {
    registerEvmSignerHydrationRecovery({
      bump: bumpHydrationEpoch,
      resetAttempts: resetHydrationAttempts,
    })
    return () =>
      registerEvmSignerHydrationRecovery({ bump: null, resetAttempts: null })
  }, [bumpHydrationEpoch, resetHydrationAttempts])

  useEffect(() => {
    if (typeof document === "undefined") return

    const nudgeHydrationAfterReturn = (source: string) => {
      if (document.visibilityState !== "visible") return
      if (!evmRuntimeActive || !isEthereumNetwork || !walletProvider) return
      hydrationAttemptsRef.current = 0
      if (signer) return
      stakingSentryBreadcrumb("signer_hydration_resume_nudge", { source })
      bumpHydrationEpoch()
    }

    const onVisibility = () => {
      nudgeHydrationAfterReturn("visibilitychange")
    }

    const onPageShow = (e: PageTransitionEvent) => {
      nudgeHydrationAfterReturn(
        e.persisted ? "pageshow_bfcache" : "pageshow"
      )
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pageshow", onPageShow)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pageshow", onPageShow)
    }
  }, [
    evmRuntimeActive,
    isEthereumNetwork,
    walletProvider,
    signer,
    bumpHydrationEpoch,
  ])

  const getEtrBalance = useCallback(async () => {
    if (!provider || !isEthereumNetwork || !address) return 0

    const balance = await provider.getBalance(address)

    return Number(balance)
  }, [provider, isEthereumNetwork, address])

  const getEthTokenBalance = useCallback(
    async (tokenAddress: string) => {
      if (!provider || !isEthereumNetwork || !address) return 0

      const token = new Contract(tokenAddress, ERC20_ABI, provider)
      const balance = await token.balanceOf(address)

      return Number(balance)
    },
    [provider, isEthereumNetwork, address]
  )

  useEffect(() => {
    const trimmedAddress = address?.trim() ?? ""
    const sessionKey = `${trimmedAddress}:${String(Boolean(walletProvider))}`

    if (hydrationSessionRef.current !== sessionKey) {
      hydrationSessionRef.current = sessionKey
      hydrationAttemptsRef.current = 0
      hydrationRunGenRef.current += 1
    }

    if (!evmRuntimeActive || !walletProvider || !isEthereumNetwork) {
      hydrationAttemptsRef.current = 0
      hydrationRunGenRef.current += 1
      setProvider(undefined)
      setSigner(undefined)
      traceStakingEvmSignerHydration({
        phase: "clear",
        evmRuntimeActive,
        isEthereumNetwork,
        hasWalletProvider: Boolean(walletProvider),
        address: trimmedAddress || null,
        hasSigner: false,
      })
      return
    }

    if (!trimmedAddress) {
      hydrationRunGenRef.current += 1
      setProvider(undefined)
      setSigner(undefined)
      return
    }

    if (hydrationAttemptsRef.current >= MAX_SIGNER_HYDRATION_ATTEMPTS) {
      return
    }

    const runGen = hydrationRunGenRef.current + 1
    hydrationRunGenRef.current = runGen

    stakingSentryBreadcrumb("signer_hydration_start", {
      has_wallet_provider: true,
      hydration_epoch: hydrationEpoch,
    })
    traceTxMobilePipeline("signer_request", { source: "getSigner" })

    let cancelled = false

    void (async () => {
      const result = await resolveEvmSignerFromWalletProvider({
        walletProvider,
        expectedAddress: trimmedAddress,
        mobileSignerTimeoutMs: isMobileWalletUserAgent() ? 45_000 : 0,
      })

      if (cancelled || runGen !== hydrationRunGenRef.current) return

      if (result.ok) {
        hydrationAttemptsRef.current = 0
        setProvider(result.provider)
        setSigner(result.signer)
        traceStakingEvmSignerHydration({
          phase: "signer_resolved",
          evmRuntimeActive,
          isEthereumNetwork,
          hasWalletProvider: true,
          address: trimmedAddress,
          hasSigner: true,
        })
        stakingSentryBreadcrumb("signer_hydration_success", {
          has_signer: true,
        })
        traceTxMobilePipeline("signer_resolved", { source: "getSigner" })
        stakingSentryBreadcrumb("wallet_connected", {
          namespace: "eip155",
        })
        return
      }

      const accountsInvalid = result.reason.startsWith("eth_accounts")
      const transientFailure = isTransientEvmSignerHydrationFailure({
        reason: result.reason,
        error: result.error,
      })
      const handoffLikely = isWalletHandoffLikely()
      const txModalActive = isStakingTxModalActivityActive()

      if (!transientFailure && !handoffLikely) {
        hydrationAttemptsRef.current += 1
      }

      if (accountsInvalid) {
        setProvider(undefined)
        setSigner(undefined)
      } else if (!transientFailure) {
        setProvider(new BrowserProvider(walletProvider))
        setSigner(undefined)
      }

      traceStakingEvmSignerHydration({
        phase: "signer_failed",
        evmRuntimeActive,
        isEthereumNetwork,
        hasWalletProvider: true,
        address: trimmedAddress,
        hasSigner: false,
      })
      stakingSentryBreadcrumb("signer_hydration_failure", {
        has_wallet_provider: true,
        reason: result.reason,
        transient: transientFailure,
        handoff_likely: handoffLikely,
        tx_modal_active: txModalActive,
      })
      traceTxMobilePipeline("signer_failed", {
        source: "getSigner",
        reason: result.reason,
      })

      if (
        isWalletConnectStaleSessionError(result.error) &&
        !txModalActive &&
        !handoffLikely &&
        !transientFailure
      ) {
        void handleWalletConnectStaleSessionError(
          "evm_signer_hydration",
          result.error
        )
      }

      if (
        !accountsInvalid &&
        !transientFailure &&
        !handoffLikely &&
        !txModalActive
      ) {
        captureStakingException(result.error, {
          signerHydration: "failed",
          walletProvider: "eip155",
          event: STAKING_SENTRY_EVENT.hydration.signer_hydration_stalled,
          contexts: {
            staking_hydration: {
              phase: "signer_failed",
              reason: result.reason,
              evm_runtime_active: evmRuntimeActive,
              has_wallet_provider: true,
              hydration_epoch: hydrationEpoch,
            },
            staking_wallet: {
              namespace: "eip155",
            },
          },
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    evmRuntimeActive,
    walletProvider,
    address,
    isEthereumNetwork,
    hydrationEpoch,
  ])

  useEffect(() => {
    if (!evmRuntimeActive || !walletProvider) return
    const provider = walletProvider as Provider & {
      on?: (event: string, listener: (...args: unknown[]) => void) => void
      removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
    }
    if (typeof provider.on !== "function") return

    const onAccountsChanged = (accounts: unknown) => {
      const next =
        Array.isArray(accounts) && typeof accounts[0] === "string"
          ? accounts[0].trim().toLowerCase()
          : null
      const prev = address?.trim().toLowerCase() ?? null
      if (!next || next === prev) return
      traceAccountChangedDetected({
        previousAddress: prev,
        liveAppKitAddress: next,
        hasActiveTx: isStakingTxModalActivityActive(),
        source: "eip1193_accounts_changed",
      })
    }
    provider.on("accountsChanged", onAccountsChanged)
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged)
    }
  }, [evmRuntimeActive, walletProvider, address])

  return {
    address,
    isConnected,
    isEthereumNetwork,
    provider,
    signer,
    getEtrBalance,
    getEthTokenBalance,
  }
}

export default useEtheriumWallet
