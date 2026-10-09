// Phase D2a extracted presentation selectors

import type { BrowserProvider, Signer } from "ethers"

export type StakingTokenMetaErrorCode = "WRONG_NETWORK" | "RPC_ERROR"

export type SelectIsWrongNetworkInput = Readonly<{
  isTronPassiveRuntime: boolean
  runtimeWalletHasAccount: boolean
  runtimeWalletNetworkOk: boolean
  executionConnected: boolean
  isEthereumNetwork: boolean
  numericChainId: number | null
  expectedChainId: number
}>

export function selectIsWrongNetwork(input: SelectIsWrongNetworkInput): boolean {
  if (input.isTronPassiveRuntime) {
    if (!input.runtimeWalletHasAccount) return false
    return !input.runtimeWalletNetworkOk
  }
  if (!input.executionConnected || !input.isEthereumNetwork) return false
  return input.numericChainId !== input.expectedChainId
}

export type SelectVaultDataReadyInput = Readonly<{
  isTronPassiveRuntime: boolean
  walletIdentityConnected: boolean
  isEthereumNetwork: boolean
  isWrongNetwork: boolean
  assetResolved: boolean
  tokenAddress: string | null
  tokenMetaFetched: boolean
  balancesFetched: boolean
}>

export function selectVaultDataReady(input: SelectVaultDataReadyInput): boolean {
  if (input.isTronPassiveRuntime) {
    if (!input.assetResolved) return false
    if (!input.tokenAddress) return true
    return input.tokenMetaFetched && input.balancesFetched
  }
  if (!input.walletIdentityConnected) return true
  if (!input.isEthereumNetwork || input.isWrongNetwork) return true
  if (!input.assetResolved) return false
  if (!input.tokenAddress) return true
  return input.tokenMetaFetched && input.balancesFetched
}

export type SelectCanTransactInput = Readonly<{
  executionConnected: boolean
  isTronPassiveRuntime: boolean
  isEthereumNetwork: boolean
  isWrongNetwork: boolean
  executionAddress: string | undefined
  signer: Signer | undefined
  provider: BrowserProvider | undefined
  tokenAddress: string | null
  tokenDecimals: number | null
  tokenMetaError: StakingTokenMetaErrorCode | null
}>

export function selectCanTransact(input: SelectCanTransactInput): boolean {
  return selectTxExecutionReady(input)
}

/** App-layer gate for vault send / retry — signer + provider + execution environment (not WC session). */
export function selectTxExecutionReady(input: SelectCanTransactInput): boolean {
  return Boolean(
    input.executionConnected &&
      !input.isTronPassiveRuntime &&
      input.isEthereumNetwork &&
      !input.isWrongNetwork &&
      input.executionAddress &&
      input.signer &&
      input.provider &&
      input.tokenAddress &&
      input.tokenDecimals !== null &&
      !input.tokenMetaError
  )
}

export type SelectAwaitingSignerInput = Readonly<{
  executionConnected: boolean
  isTronPassiveRuntime: boolean
  isEthereumNetwork: boolean
  isWrongNetwork: boolean
  executionAddress: string | undefined
  provider: BrowserProvider | undefined
  tokenAddress: string | null
  signer: Signer | undefined
}>

export function selectAwaitingSigner(input: SelectAwaitingSignerInput): boolean {
  return Boolean(
    input.executionConnected &&
      !input.isTronPassiveRuntime &&
      input.isEthereumNetwork &&
      !input.isWrongNetwork &&
      input.executionAddress &&
      input.provider &&
      input.tokenAddress &&
      !input.signer
  )
}

export type SelectExecutionNetworkOkInput = Readonly<{
  executionConnected: boolean
  executionChainId: number | null
  expectedChainId: number
}>

export function selectExecutionNetworkOk(input: SelectExecutionNetworkOkInput): boolean {
  return (
    input.executionConnected &&
    input.executionChainId !== null &&
    input.executionChainId === input.expectedChainId
  )
}
