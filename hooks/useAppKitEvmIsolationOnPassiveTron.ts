import { useAppKitReady } from "@/hooks/useAppKitReady"
import { recordStakingRuntimeSoakContaminationDisconnect } from "@/staking/diagnostics"
import { useActiveRuntimeSelection } from "@/staking/core/runtimeSelectionContext"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react"
import { createElement, useCallback, useEffect, useRef, type ReactElement } from "react"

type IsolationFireReason = "tron_runtime_entry" | "eip155_contamination"

type EvmIsolationDevPayload = Readonly<{
  reason: IsolationFireReason | "entry_skipped_prior_isolation"
  runtimeKey: string
  eip155Address: string | null
  tronNamespaceAddress: string | null
  eip155Connected: boolean
  eip155Leakage: boolean
  fired: boolean
  skipped: boolean
  skipNote?: string
}>

function detectEip155Leakage(
  connected: boolean,
  address: string | undefined
): boolean {
  if (connected) return true
  const trimmed = address?.trim()
  if (!trimmed) return false
  return true
}

/**
 * Passive Tron runtime uses TronLink only. AppKit's EIP-155 adapter still listens to injected
 * `accountsChanged`; TronLink can emit base58 addresses there, which triggers WalletConnect
 * identity lookups that 400. Disconnect EIP-155 while Tron is the active staking runtime.
 *
 * Renders AppKit hooks only after `AppKitReadyProvider` marks ready (never before `createAppKit`).
 */
export function AppKitEvmIsolationOnPassiveTron(): ReactElement | null {
  const ready = useAppKitReady()
  if (!ready) return null
  return createElement(AppKitEvmIsolationOnPassiveTronHooks)
}

function AppKitEvmIsolationOnPassiveTronHooks(): null {
  const runtime = useActiveRuntimeSelection()
  const tronFamilyRolloutEnabled = isRuntimeFamilyEnabled("tron")
  const isTronRuntime = runtime.deployment.chainFamily === "tron"
  const runtimeKey = runtime.runtimeKey

  const { address: eip155Address, isConnected: eip155Connected } = useAppKitAccount({
    namespace: "eip155",
  })
  const { address: tronNamespaceAddress } = useAppKitAccount({ namespace: "tron" })
  const { disconnect } = useDisconnect()

  const disconnectingRef = useRef(false)
  const entryIsolatedRuntimeKeyRef = useRef<string | null>(null)
  const entrySkipLoggedRuntimeKeyRef = useRef<string | null>(null)
  const prevLeakageRef = useRef(false)

  const eip155ConnectedRef = useRef(eip155Connected)
  const eip155AddressRef = useRef(eip155Address)
  eip155ConnectedRef.current = eip155Connected
  eip155AddressRef.current = eip155Address

  const tronNamespaceAddressRef = useRef(tronNamespaceAddress)
  tronNamespaceAddressRef.current = tronNamespaceAddress

  const eip155Leakage = detectEip155Leakage(eip155Connected, eip155Address)

  const snapshotDiagnostics = useCallback((): Omit<EvmIsolationDevPayload, "reason" | "fired" | "skipped" | "skipNote"> => {
    const eip155Addr = eip155AddressRef.current?.trim() ?? null
    const tronAddr = tronNamespaceAddressRef.current?.trim() ?? null
    const connected = eip155ConnectedRef.current
    return {
      runtimeKey,
      eip155Address: eip155Addr,
      tronNamespaceAddress: tronAddr,
      eip155Connected: connected,
      eip155Leakage: detectEip155Leakage(connected, eip155AddressRef.current),
    }
  }, [runtimeKey])

  const traceDev = useCallback(
    (payload: EvmIsolationDevPayload) => {
      if (!(process.env.NODE_ENV !== 'production')) return
      console.debug("[appkit-evm-isolation]", payload)
    },
    []
  )

  const runDisconnect = useCallback(
    (reason: IsolationFireReason) => {
      const diag = snapshotDiagnostics()

      if (disconnectingRef.current) {
        traceDev({
          ...diag,
          reason,
          fired: false,
          skipped: true,
          skipNote: "disconnect_in_flight",
        })
        return
      }

      traceDev({
        ...diag,
        reason,
        fired: true,
        skipped: false,
      })
      recordStakingRuntimeSoakContaminationDisconnect({
        runtimeKey: diag.runtimeKey,
        reason,
      })

      disconnectingRef.current = true
      void disconnect({ namespace: "eip155" }).finally(() => {
        disconnectingRef.current = false
        prevLeakageRef.current = detectEip155Leakage(
          eip155ConnectedRef.current,
          eip155AddressRef.current
        )
      })
    },
    [disconnect, snapshotDiagnostics, traceDev]
  )

  useEffect(() => {
    if (!tronFamilyRolloutEnabled) return
    if (!isTronRuntime) {
      entryIsolatedRuntimeKeyRef.current = null
      entrySkipLoggedRuntimeKeyRef.current = null
      prevLeakageRef.current = false
      return
    }

    if (entryIsolatedRuntimeKeyRef.current === runtimeKey) {
      if (
        (process.env.NODE_ENV !== 'production') &&
        entrySkipLoggedRuntimeKeyRef.current !== runtimeKey
      ) {
        entrySkipLoggedRuntimeKeyRef.current = runtimeKey
        traceDev({
          ...snapshotDiagnostics(),
          reason: "entry_skipped_prior_isolation",
          fired: false,
          skipped: true,
          skipNote: "already_isolated_this_runtime_session",
        })
      }
      return
    }

    entryIsolatedRuntimeKeyRef.current = runtimeKey
    entrySkipLoggedRuntimeKeyRef.current = runtimeKey
    prevLeakageRef.current = true
    runDisconnect("tron_runtime_entry")
  }, [isTronRuntime, runtimeKey, runDisconnect, snapshotDiagnostics, traceDev, tronFamilyRolloutEnabled])

  useEffect(() => {
    if (!tronFamilyRolloutEnabled) return
    if (!isTronRuntime) return
    if (entryIsolatedRuntimeKeyRef.current !== runtimeKey) return

    const prevLeakage = prevLeakageRef.current
    const currentLeakage = eip155Leakage

    if (currentLeakage && !prevLeakage) {
      prevLeakageRef.current = true
      runDisconnect("eip155_contamination")
      return
    }

    prevLeakageRef.current = currentLeakage
  }, [isTronRuntime, runtimeKey, eip155Leakage, runDisconnect, tronFamilyRolloutEnabled])

  return null
}
