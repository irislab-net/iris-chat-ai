import type { TronConnector } from "@reown/appkit-adapter-tron"
import type { CaipNetwork } from "@reown/appkit/react"
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react"
import { useMemo } from "react"

const TRON_NAMESPACE = "tron" as const

export type UseAppKitTronAccountResult = Readonly<{
  address: string | undefined
  isConnected: boolean
  caipAddress: string | undefined
  provider: TronConnector | undefined
  network: CaipNetwork | undefined
}>

/**
 * Read-only AppKit TRON namespace session (Phase 1 — infrastructure only).
 * Does not replace passive TronLink identity or mutate staking runtime state.
 */
export function useAppKitTronAccount(): UseAppKitTronAccountResult {
  const { address, isConnected, caipAddress } = useAppKitAccount({
    namespace: TRON_NAMESPACE,
  })
  const { walletProvider } = useAppKitProvider<TronConnector>(TRON_NAMESPACE)
  const { caipNetwork } = useAppKitNetwork()

  const network = useMemo((): CaipNetwork | undefined => {
    if (caipNetwork?.chainNamespace === TRON_NAMESPACE) return caipNetwork
    return undefined
  }, [caipNetwork])

  return useMemo(
    () => ({
      address,
      isConnected: Boolean(isConnected),
      caipAddress,
      provider: walletProvider,
      network,
    }),
    [address, isConnected, caipAddress, walletProvider, network]
  )
}
