import type { EthUsdFeedPresentation } from "@/staking/execution"
import {
  getStakingEthUsdPresentation,
  subscribeStakingEthUsdPresentation,
} from "@/staking/execution"
import { useEffect, useState } from "react"

/**
 * React binding to the shared Chainlink ETH/USD presentation cache.
 *
 * - When `shouldSubscribe` is false: returns `{ kind: "none" }` and does **not**
 *   hold a transport subscription (no background polling for idle pages).
 * - When true: ref-counts the singleton poller; updates on cache refresh only.
 *
 * Never triggers gas estimation or smoothing resets — consumers only pass the
 * snapshot into `buildNetworkFeeDisplayLine`.
 */
export function useStakingEthUsdPresentation(
  shouldSubscribe: boolean
): EthUsdFeedPresentation {
  const [presentation, setPresentation] = useState<EthUsdFeedPresentation>(() =>
    shouldSubscribe ? getStakingEthUsdPresentation() : { kind: "none" }
  )

  useEffect(() => {
    if (!shouldSubscribe) {
      setPresentation({ kind: "none" })
      return
    }

    setPresentation(getStakingEthUsdPresentation())
    return subscribeStakingEthUsdPresentation(() => {
      setPresentation(getStakingEthUsdPresentation())
    })
  }, [shouldSubscribe])

  return presentation
}
