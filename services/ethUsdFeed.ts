import { DEBUG_LOGS } from "@/config/env"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
import { logger } from "@/lib/logger"
import { getStakingJsonRpcProvider } from "@/staking/execution"
import { Contract } from "ethers"

/**
 * Chainlink AggregatorV3Interface — only the reads required for ETH/USD display.
 * @see https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol
 */
const AGGREGATOR_V3_ABI = [
  "function decimals() view returns (uint8)",
  "function latestRoundData() view returns (uint80 roundId,int256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)",
] as const

export type EthUsdFeedRead = Readonly<{
  answer: bigint
  feedDecimals: number
  updatedAt: bigint
  roundId: bigint
}>

function devFeedLog(message: string, data?: Record<string, unknown>) {
  if (!DEBUG_LOGS) return
  logger.log(`[ethUsdFeed] ${message}`, data ?? "")
}

/**
 * Reads latest Chainlink ETH/USD data from the staking JsonRpc singleton.
 * Completely separate from `gasEstimator` / fee caches / tx execution.
 */
export async function readChainlinkEthUsdLatest(params: {
  feedAddress: string
  signal?: AbortSignal
}): Promise<EthUsdFeedRead | null> {
  if (!isRuntimeFamilyEnabled("evm")) return null
  if (params.signal?.aborted) return null
  const provider = getStakingJsonRpcProvider()
  const c = new Contract(params.feedAddress, AGGREGATOR_V3_ABI, provider)

  try {
    const decRaw: unknown = await c.decimals()
    const feedDecimals = Number(decRaw)
    if (!Number.isInteger(feedDecimals) || feedDecimals < 0 || feedDecimals > 36) {
      devFeedLog("invalid_decimals", { feedDecimals: decRaw })
      return null
    }

    if (params.signal?.aborted) return null
    const rd: unknown = await c.latestRoundData()
    if (!Array.isArray(rd) || rd.length < 5) {
      devFeedLog("latestRoundData_shape", {})
      return null
    }

    const roundId = BigInt(rd[0] as string | number | bigint)
    const ansSigned = BigInt(rd[1] as string | number | bigint)
    const updatedAt = BigInt(rd[3] as string | number | bigint)

    if (ansSigned <= 0n) {
      devFeedLog("non_positive_answer", { answer: ansSigned.toString() })
      return null
    }

    const answer = ansSigned
    devFeedLog("read_ok", {
      roundId: roundId.toString(),
      feedDecimals,
      updatedAt: updatedAt.toString(),
    })

    return {
      answer,
      feedDecimals,
      updatedAt,
      roundId,
    }
  } catch (e) {
    devFeedLog("read_failed", { err: String(e) })
    return null
  }
}
