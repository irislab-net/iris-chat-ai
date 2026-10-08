import { useTelegramEscalation } from "@/contexts/TelegramEscalationContext"
import {
  openUnifiedAccountView,
  openUnifiedWallet,
  requestUnifiedNetworkSwitch,
  type UnifiedWalletAppKitClient,
  type UnifiedWalletRuntimeNamespace,
} from "@/staking/orchestration/openUnifiedWallet"
import { useAppKit, useAppKitNetwork } from "@reown/appkit/react"
import { useCallback, useMemo } from "react"

export type {
  UnifiedWalletRuntimeNamespace,
  UnifiedWalletAppKitClient,
} from "@/staking/orchestration/openUnifiedWallet"

export function useUnifiedWalletAppKitClient(): UnifiedWalletAppKitClient {
  const { open } = useAppKit()
  const { switchNetwork } = useAppKitNetwork()
  return useMemo(
    () => ({
      open,
      switchNetwork,
    }),
    [open, switchNetwork]
  )
}

export type UnifiedWalletOrchestrationActions = Readonly<{
  openWallet: () => void
  openAccountView: () => void
  requestNetworkSwitch: (deploymentCaip2: string) => Promise<boolean>
}>

/**
 * AppKit-owned connect / account / network orchestration for a single runtime namespace.
 */
export function useUnifiedWalletOrchestration(input: Readonly<{
  namespace: UnifiedWalletRuntimeNamespace
  connected: boolean
  wrongNetwork?: boolean
}>): UnifiedWalletOrchestrationActions {
  const appKit = useUnifiedWalletAppKitClient()
  const escalation = useTelegramEscalation()

  const guardTelegram = useCallback((): boolean => {
    if (escalation.isUnsupportedEnvironment) {
      escalation.openNotice()
      return false
    }
    return true
  }, [escalation])

  const openWallet = useCallback(() => {
    if (!guardTelegram()) {
      return
    }
    openUnifiedWallet({
      appKit,
      namespace: input.namespace,
      connected: input.connected,
      wrongNetwork: input.wrongNetwork,
    })
  }, [
    appKit,
    guardTelegram,
    input.namespace,
    input.connected,
    input.wrongNetwork,
  ])

  const openAccountView = useCallback(() => {
    if (!guardTelegram()) return
    openUnifiedAccountView({
      appKit,
      namespace: input.namespace,
    })
  }, [appKit, guardTelegram, input.namespace])

  const requestNetworkSwitchFn = useCallback(
    (deploymentCaip2: string) => {
      if (!guardTelegram()) return Promise.resolve(false)
      return requestUnifiedNetworkSwitch({
        appKit,
        namespace: input.namespace,
        deploymentCaip2,
      })
    },
    [appKit, guardTelegram, input.namespace]
  )

  return useMemo(
    () => ({
      openWallet,
      openAccountView,
      requestNetworkSwitch: requestNetworkSwitchFn,
    }),
    [openWallet, openAccountView, requestNetworkSwitchFn]
  )
}
