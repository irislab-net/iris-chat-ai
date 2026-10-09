import { isWithinAppKitHydrationGrace } from "@/lib/wallet/appKitSessionHydrationObserve"
import {
  noteAppKitAccountHydrationSettled,
  noteAppKitAccountHydrationStarted,
  performWalletManualDisconnect,
  resolveEffectiveEvmWalletIdentity,
  traceAccountChangedDetected,
} from "@/lib/wallet/walletAccountIdentityOrchestrator"
import { traceWalletAccountIdentity } from "@/lib/wallet/walletAccountIdentityTelemetry"
import { useAppKitAccount } from "@reown/appkit/react"
import { useEffect, useMemo, useRef, useState } from "react"

type UseWalletAccountIdentityGuardInput = Readonly<{
  appKitAddress: string | undefined
  appKitConnected: boolean
  hasActiveTx?: boolean
}>

export function useWalletAccountIdentityGuard(
  input: UseWalletAccountIdentityGuardInput
) {
  const { status } = useAppKitAccount({ namespace: "eip155" })
  const prevStatusRef = useRef<string | undefined>(undefined)
  const prevAddressRef = useRef<string | null>(null)
  const prevConnectedRef = useRef<boolean>(false)
  const disconnectHandledRef = useRef(false)
  const [hydrationSettled, setHydrationSettled] = useState(false)

  useEffect(() => {
    noteAppKitAccountHydrationStarted()
    const settle = () => {
      if (isWithinAppKitHydrationGrace()) return
      setHydrationSettled(true)
      noteAppKitAccountHydrationSettled()
    }
    settle()
    const timer = window.setTimeout(settle, 12_500)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    const prevConnected = prevConnectedRef.current
    const prevAddress = prevAddressRef.current
    const curAddress = input.appKitAddress?.trim().toLowerCase() ?? null

    prevStatusRef.current = status
    prevConnectedRef.current = input.appKitConnected
    prevAddressRef.current = curAddress

    if (
      hydrationSettled &&
      input.appKitConnected &&
      curAddress &&
      prevConnected === false &&
      prevStatus !== "connecting"
    ) {
      traceWalletAccountIdentity("appkit_account_restored", {
        liveAppKitAddress: curAddress,
        appKitStatus: status ?? null,
        manualDisconnectGuard: false,
      })
    }

    if (
      prevConnected &&
      !input.appKitConnected &&
      (status === "disconnected" || prevStatus === "connected") &&
      !disconnectHandledRef.current
    ) {
      disconnectHandledRef.current = true
      void performWalletManualDisconnect({
        previousAddress: prevAddress,
        source: "appkit_account_disconnected",
        hasActiveTx: input.hasActiveTx,
      })
    }

    if (input.appKitConnected) {
      disconnectHandledRef.current = false
    }

    if (
      prevAddress &&
      curAddress &&
      prevAddress !== curAddress &&
      hydrationSettled
    ) {
      traceAccountChangedDetected({
        previousAddress: prevAddress,
        liveAppKitAddress: curAddress,
        hasActiveTx: Boolean(input.hasActiveTx),
        source: "appkit_account_address_change",
      })
    }
  }, [
    input.appKitAddress,
    input.appKitConnected,
    input.hasActiveTx,
    status,
    hydrationSettled,
  ])

  return useMemo(
    () =>
      resolveEffectiveEvmWalletIdentity({
        appKitAddress: input.appKitAddress,
        appKitConnected: input.appKitConnected,
        appKitStatus: status,
        hydrationSettled,
      }),
    [input.appKitAddress, input.appKitConnected, status, hydrationSettled]
  )
}
