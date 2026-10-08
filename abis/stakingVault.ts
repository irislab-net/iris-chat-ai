/** Minimal ERC-20 + vault fragments for the staking contracts. */

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
] as const

/** Stake: `deposit` or `depositWithAffiliate` — see `useStakingVault`. Unstake: `withdraw`. */
export const STAKING_VAULT_ABI = [
  "function asset() view returns (address)",
  "function maxDeposit(address receiver) view returns (uint256)",
  "function maxWithdraw(address owner) view returns (uint256)",
  "function minWithdrawalFee() view returns (uint256)",
  "function withdrawalFee(uint256 assets) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function depositWithAffiliate(uint256 assets, address receiver, address affiliate) returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
] as const
