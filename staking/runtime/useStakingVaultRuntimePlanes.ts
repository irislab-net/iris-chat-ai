import { useEffect, useMemo, useRef } from "react"
import { getExpectedChainId, isAppKitTronIdentityEnabled } from "@/staking/config"
import { useWalletAccountIdentityGuard } from "@/hooks/useWalletAccountIdentityGuard"
import useEtheriumWallet from "@/hooks/useEtheriumWallet"
import {
  clearStakingRuntimeWalletIdentityPublish,
  publishStakingRuntimeWalletIdentity,
  resolveStakingRuntimeWalletIdentity,
  traceUnifiedTronFallbackActivationDev,
  traceUnifiedTronIdentityMismatchDev,
} from "@/staking/identity"
import {
  passiveTronNetworkMatches,
  usePassiveTronWalletBase58,
  usePassiveTronWalletChainId,
} from "@/staking/identity/tron/tronWalletIdentity"
import { selectExecutionNetworkOk, selectRuntimeWalletShortAddress } from "@/staking/selectors"
import { createDeploymentExplorerResolver } from "@/staking/core/createExplorerResolver"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { StakingRuntimeWalletIdentity } from "@/staking/identity/stakingRuntimeWalletIdentity"
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react"
import type { BrowserProvider, Signer } from "ethers"
import { devAssertNoDeprecatedRuntimePlaneAliases } from "@/staking/diagnostics/stakingInvariantAssertionsDev"
import { normalizeStakingVaultChainId } from "@/staking/runtime/stakingVaultChainId"

export type { StakingRuntimeWalletIdentity }

export type UseStakingVaultRuntimePlanesInput = Readonly<{
  stakingRuntime: RuntimeOperationContext
}>

export type StakingVaultRuntimePlanes = Readonly<{
  stakingRuntime: RuntimeOperationContext
  isTronPassiveRuntime: boolean
  appKitTronIdentityEnabled: boolean
  executionAddress: string | undefined
  executionConnected: boolean
  expectedChainId: number
  executionChainId: number | null
  executionNetworkOk: boolean
  passiveTronWalletBase58: string | null | undefined
  passiveTronChainId: string | null | undefined
  runtimeWallet: StakingRuntimeWalletIdentity
  hasTronAccount: boolean
  runtimeWalletAddress: string | null
  runtimeWalletConnected: boolean
  runtimeWalletShortAddress: string
  stakingOwnerAddress: string | null
  numericChainId: number | null
  stakingExplorerUrl: string | null
  switchNetwork: ReturnType<typeof useAppKitNetwork>["switchNetwork"]
  caipNetwork: ReturnType<typeof useAppKitNetwork>["caipNetwork"]
  appKitNetworkChainId: ReturnType<typeof useAppKitNetwork>["chainId"]
  tronAppKitAddressRaw: string | undefined
  tronAppKitConnected: boolean
  provider: BrowserProvider | undefined
  signer: Signer | undefined
  isEthereumNetwork: boolean
}>

export function useStakingVaultRuntimePlanes(
  input: UseStakingVaultRuntimePlanesInput
): StakingVaultRuntimePlanes {
  const { stakingRuntime } = input
  const isTronPassiveRuntime = stakingRuntime.deployment.chainFamily === "tron"

  const appKitTronIdentityEnabled = isAppKitTronIdentityEnabled()
  const {
    address: eip155AddressRaw,
    isConnected: eip155Connected,
    caipAddress: eip155CaipAddress,
  } = useAppKitAccount({ namespace: "eip155" })
  const {
    address: tronAppKitAddressRaw,
    isConnected: tronAppKitConnected,
    caipAddress: tronAppKitCaipAddress,
  } = useAppKitAccount({ namespace: "tron" })
  const { chainId: appKitNetworkChainId, caipNetwork, switchNetwork } =
    useAppKitNetwork()

  const rawExecutionAddress = eip155AddressRaw?.trim() || undefined
  const rawExecutionConnected = Boolean(eip155Connected)
  const identityGuard = useWalletAccountIdentityGuard({
    appKitAddress: rawExecutionAddress,
    appKitConnected: rawExecutionConnected,
  })
  const executionAddress = identityGuard.effectiveAddress
  const executionConnected = identityGuard.effectiveConnected
  const expectedChainId = useMemo(() => getExpectedChainId(), [])
  const executionChainId = useMemo((): number | null => {
    if (caipNetwork?.chainNamespace === "eip155") {
      return normalizeStakingVaultChainId(appKitNetworkChainId)
    }
    const caip = eip155CaipAddress?.trim() ?? ""
    const m = /^eip155:(\d+):/i.exec(caip)
    if (!m) return null
    const n = Number.parseInt(m[1], 10)
    return Number.isFinite(n) ? n : null
  }, [caipNetwork?.chainNamespace, appKitNetworkChainId, eip155CaipAddress])

  const executionNetworkOk = useMemo(
    () =>
      selectExecutionNetworkOk({
        executionConnected,
        executionChainId,
        expectedChainId,
      }),
    [executionConnected, executionChainId, expectedChainId]
  )

  const passiveTronWalletBase58 = usePassiveTronWalletBase58(isTronPassiveRuntime)
  const passiveTronChainId = usePassiveTronWalletChainId(isTronPassiveRuntime)
  const passiveTronNetworkOk = useMemo(() => {
    if (!isTronPassiveRuntime) return true
    return passiveTronNetworkMatches(stakingRuntime.deployment.caip2)
  }, [isTronPassiveRuntime, stakingRuntime.deployment.caip2])

  const appKitTronForIdentity = useMemo(
    () => ({
      address: tronAppKitAddressRaw,
      isConnected: Boolean(tronAppKitConnected),
      caipAddress: tronAppKitCaipAddress,
      network: undefined,
    }),
    [tronAppKitAddressRaw, tronAppKitConnected, tronAppKitCaipAddress]
  )

  const runtimeWallet = useMemo(
    () =>
      resolveStakingRuntimeWalletIdentity({
        chainFamily: stakingRuntime.deployment.chainFamily,
        evmAddress: executionAddress,
        evmConnected: executionConnected,
        passiveTronBase58: passiveTronWalletBase58,
        passiveTronNetworkOk,
        unifiedTron:
          isTronPassiveRuntime && appKitTronIdentityEnabled
            ? {
                deploymentCaip2: stakingRuntime.deployment.caip2,
                appKit: appKitTronForIdentity,
                passive: {
                  base58: passiveTronWalletBase58,
                  chainId: passiveTronChainId,
                  networkOk: passiveTronNetworkOk,
                },
              }
            : undefined,
      }),
    [
      stakingRuntime.deployment.chainFamily,
      stakingRuntime.deployment.caip2,
      executionAddress,
      executionConnected,
      passiveTronWalletBase58,
      passiveTronChainId,
      passiveTronNetworkOk,
      isTronPassiveRuntime,
      appKitTronIdentityEnabled,
      appKitTronForIdentity,
    ]
  )

  const hasTronAccount = isTronPassiveRuntime
    ? runtimeWallet.hasAccount
    : Boolean(passiveTronWalletBase58?.trim())
  const runtimeWalletAddress = runtimeWallet.address
  const runtimeWalletConnected = runtimeWallet.connected
  const runtimeWalletShortAddress = useMemo(
    () => selectRuntimeWalletShortAddress(runtimeWalletAddress ?? undefined),
    [runtimeWalletAddress]
  )
  const stakingOwnerAddress = runtimeWalletAddress
  const numericChainId = executionChainId

  const stakingExplorerUrl = useMemo(() => {
    const res = createDeploymentExplorerResolver(stakingRuntime.deployment)
    const a = runtimeWalletAddress?.trim()
    return a ? res.addressUrl(a) : null
  }, [stakingRuntime.deployment, runtimeWalletAddress])

  const prevTronIdentityOriginRef = useRef(runtimeWallet.identityOrigin)

  useEffect(() => {
    publishStakingRuntimeWalletIdentity(runtimeWallet, {
      runtimeKey: stakingRuntime.runtimeKey,
    })
    return () => {
      clearStakingRuntimeWalletIdentityPublish()
    }
  }, [runtimeWallet, stakingRuntime.runtimeKey])

  useEffect(() => {
    if (!appKitTronIdentityEnabled || !isTronPassiveRuntime) return
    const prev = prevTronIdentityOriginRef.current
    const cur = runtimeWallet.identityOrigin
    prevTronIdentityOriginRef.current = cur
    if (prev === "appkit" && cur === "passive") {
      traceUnifiedTronFallbackActivationDev(
        tronAppKitConnected ? "appkit_invalid_address" : "appkit_disconnected"
      )
    }
  }, [
    appKitTronIdentityEnabled,
    isTronPassiveRuntime,
    runtimeWallet.identityOrigin,
    tronAppKitConnected,
  ])

  useEffect(() => {
    if (!appKitTronIdentityEnabled || !isTronPassiveRuntime) return
    traceUnifiedTronIdentityMismatchDev({
      appKitAddress: tronAppKitAddressRaw ?? null,
      passiveAddress: passiveTronWalletBase58,
      publishedOrigin: runtimeWallet.identityOrigin,
    })
  }, [
    appKitTronIdentityEnabled,
    isTronPassiveRuntime,
    tronAppKitAddressRaw,
    passiveTronWalletBase58,
    runtimeWallet.identityOrigin,
  ])

  const { provider, signer, isEthereumNetwork } = useEtheriumWallet({
    evmRuntimeActive: !isTronPassiveRuntime,
  })

  const planes = {
    stakingRuntime,
    isTronPassiveRuntime,
    appKitTronIdentityEnabled,
    executionAddress,
    executionConnected,
    expectedChainId,
    executionChainId,
    executionNetworkOk,
    passiveTronWalletBase58,
    passiveTronChainId,
    runtimeWallet,
    hasTronAccount,
    runtimeWalletAddress,
    runtimeWalletConnected,
    runtimeWalletShortAddress,
    stakingOwnerAddress,
    numericChainId,
    stakingExplorerUrl,
    switchNetwork,
    caipNetwork,
    appKitNetworkChainId,
    tronAppKitAddressRaw,
    tronAppKitConnected: Boolean(tronAppKitConnected),
    provider,
    signer,
    isEthereumNetwork,
  }
  devAssertNoDeprecatedRuntimePlaneAliases(planes as Record<string, unknown>)
  return planes
}
