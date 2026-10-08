import { MaxUint256 } from "ethers"
import { useState } from "react"

export type StakingVaultComposerBalanceState = Readonly<{
  walletBalance: bigint
  setWalletBalance: React.Dispatch<React.SetStateAction<bigint>>
  allowance: bigint
  setAllowance: React.Dispatch<React.SetStateAction<bigint>>
  stakedAssets: bigint
  setStakedAssets: React.Dispatch<React.SetStateAction<bigint>>
  vaultShares: bigint
  setVaultShares: React.Dispatch<React.SetStateAction<bigint>>
  vaultMaxDepositWei: bigint
  setVaultMaxDepositWei: React.Dispatch<React.SetStateAction<bigint>>
  vaultMaxWithdrawWei: bigint
  setVaultMaxWithdrawWei: React.Dispatch<React.SetStateAction<bigint>>
  minWithdrawalFeeWei: bigint
  setMinWithdrawalFeeWei: React.Dispatch<React.SetStateAction<bigint>>
  balancesFetched: boolean
  setBalancesFetched: React.Dispatch<React.SetStateAction<boolean>>
  observedBalanceAnchorMs: number | null
  setObservedBalanceAnchorMs: React.Dispatch<React.SetStateAction<number | null>>
}>

export function useStakingVaultComposerBalanceState(): StakingVaultComposerBalanceState {
  const [walletBalance, setWalletBalance] = useState(0n)
  const [allowance, setAllowance] = useState(0n)
  const [stakedAssets, setStakedAssets] = useState(0n)
  const [vaultShares, setVaultShares] = useState(0n)
  const [vaultMaxDepositWei, setVaultMaxDepositWei] = useState(MaxUint256)
  const [vaultMaxWithdrawWei, setVaultMaxWithdrawWei] = useState(MaxUint256)
  const [minWithdrawalFeeWei, setMinWithdrawalFeeWei] = useState(0n)
  const [balancesFetched, setBalancesFetched] = useState(false)
  const [observedBalanceAnchorMs, setObservedBalanceAnchorMs] = useState<number | null>(null)

  return {
    walletBalance,
    setWalletBalance,
    allowance,
    setAllowance,
    stakedAssets,
    setStakedAssets,
    vaultShares,
    setVaultShares,
    vaultMaxDepositWei,
    setVaultMaxDepositWei,
    vaultMaxWithdrawWei,
    setVaultMaxWithdrawWei,
    minWithdrawalFeeWei,
    setMinWithdrawalFeeWei,
    balancesFetched,
    setBalancesFetched,
    observedBalanceAnchorMs,
    setObservedBalanceAnchorMs,
  }
}
