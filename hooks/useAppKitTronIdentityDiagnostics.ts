import { isAppKitTronIdentityEnabled } from "@/staking/config"
import { useAppKitTronAccount } from "@/hooks/useAppKitTronAccount"
import { readPassiveTronWalletBase58 } from "@/staking/identity/tron/tronWalletIdentity"
import { useActiveRuntimeSelection } from "@/staking/core/runtimeSelectionContext"
import { useEffect, useRef } from "react"

/**
 * DEV-only: compare AppKit TRON namespace address vs passive TronLink identity.
 * Active when `VITE_APPKIT_TRON_IDENTITY=true` and staking runtime is Tron.
 * Phase 2: unified resolver prefers AppKit; passive is fallback only.
 */
export function useAppKitTronIdentityDiagnostics(): void {
  const enabled = isAppKitTronIdentityEnabled()
  const runtime = useActiveRuntimeSelection()
  const isTronRuntime = runtime.deployment.chainFamily === "tron"
  const appKitTron = useAppKitTronAccount()
  const lastLoggedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production') || !enabled || !isTronRuntime) return

    const appKitAddr = appKitTron.address?.trim() ?? ""
    const passiveAddr = readPassiveTronWalletBase58()?.trim() ?? ""
    const appKitCaip = appKitTron.caipAddress?.trim() ?? ""

    if (!appKitAddr && !passiveAddr) {
      lastLoggedRef.current = null
      return
    }

    if (appKitAddr === passiveAddr) {
      lastLoggedRef.current = null
      return
    }

    const sig = `${appKitAddr}|${passiveAddr}|${appKitCaip}|${appKitTron.isConnected}`
    if (lastLoggedRef.current === sig) return
    lastLoggedRef.current = sig

    console.debug("[appkit-tron-identity] layer mismatch (unified resolver picks primary)", {
      appKitAddress: appKitAddr || null,
      appKitCaipAddress: appKitCaip || null,
      appKitConnected: appKitTron.isConnected,
      passiveAddress: passiveAddr || null,
      deploymentCaip2: runtime.deployment.caip2,
      runtimeKey: runtime.runtimeKey,
    })
  }, [
    enabled,
    isTronRuntime,
    appKitTron.address,
    appKitTron.caipAddress,
    appKitTron.isConnected,
    runtime.deployment.caip2,
    runtime.runtimeKey,
  ])
}
