import { getStakingErc20Read, type StakingContractReadOptions } from "@/staking/execution"
import type { EvmTokenMeta } from "@/staking/reads/types"
import type { JsonRpcProvider } from "ethers"

export type LoadEvmTokenMetaInput = Readonly<{
  tokenAddress: string
  read: JsonRpcProvider
  stakingReadOptions: StakingContractReadOptions
}>

function normalizeEvmTokenDecimals(d: unknown): number {
  const n =
    typeof d === "bigint" ? Number(d) : typeof d === "number" ? d : Number(d)
  if (!Number.isInteger(n) || n < 0 || n > 255) {
    throw new Error(`Invalid token decimals from contract: ${String(d)}`)
  }
  return n
}

/** EVM ERC20 `decimals` / `symbol` / `name` with normalized decimals. */
export async function loadEvmTokenMeta(input: LoadEvmTokenMetaInput): Promise<EvmTokenMeta> {
  const token = getStakingErc20Read(input.tokenAddress, input.read, input.stakingReadOptions)
  const [d, sym, nm] = await Promise.all([
    token.decimals(),
    token.symbol(),
    token.name().catch(() => ""),
  ])
  return {
    decimals: normalizeEvmTokenDecimals(d),
    symbol: typeof sym === "string" ? sym : "",
    name: typeof nm === "string" ? nm : "",
  }
}
