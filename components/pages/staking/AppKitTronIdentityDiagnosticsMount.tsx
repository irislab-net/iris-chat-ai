import { useAppKitReady } from "@/hooks/useAppKitReady"
import { isAppKitTronIdentityEnabled } from "@/staking/config"
import { useAppKitTronIdentityDiagnostics } from "@/hooks/useAppKitTronIdentityDiagnostics"

/** Mounted only when `VITE_APPKIT_TRON_IDENTITY` is true — keeps Phase 1 off-path identical. */
export function AppKitTronIdentityDiagnosticsMount() {
  useAppKitTronIdentityDiagnostics()
  return null
}

export function AppKitTronIdentityDiagnosticsGate() {
  const ready = useAppKitReady()
  if (!ready || !isAppKitTronIdentityEnabled()) return null
  return <AppKitTronIdentityDiagnosticsMount />
}
