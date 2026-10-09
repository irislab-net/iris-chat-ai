"use client"
import { TelegramEscalationDialog } from "@/components/common/TelegramEscalationDialog"
import {
  TELEGRAM_NOTICE_INERT,
  TelegramEscalationContext,
  type TelegramNoticeApi,
} from "@/contexts/TelegramEscalationContext"
import { isTelegramBrowser } from "@/lib/mobile/browserEnvironment"
import {
  isStakingFunnelPathname,
  refreshStakingTelegramOriginalUrlCapture,
} from "@/staking/integrations"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"

/**
 * Telegram in-app browser is an unsupported environment for wallet flows.
 *
 * Behavior:
 *  - Detection runs once via `isTelegramBrowser()` (cached for the session).
 *  - Outside Telegram, the provider exposes `TELEGRAM_NOTICE_INERT` and renders
 *    no dialog — zero added DOM, zero behavior change.
 *  - Inside Telegram, the unsupported notice opens automatically whenever the
 *    user lands on a staking funnel route. `useWallet().open()` re-opens the
 *    same notice; AppKit is never invoked.
 *  - Full `window.location.href` is captured (with referral/hash merge) into
 *    sessionStorage + localStorage for Copy link / optional `openLink`.
 */

export function TelegramEscalationProvider({
  children,
}: {
  children: ReactNode
}) {
  const isUnsupportedEnvironment = isTelegramBrowser()
  const [isOpen, setIsOpen] = useState(false)
  const [preservedStakingAbsoluteUrl, setPreservedStakingAbsoluteUrl] = useState<
    string | null
  >(() => {
    if (!isUnsupportedEnvironment || typeof window === "undefined") return null
    if (!isStakingFunnelPathname(window.location.pathname)) return null
    return refreshStakingTelegramOriginalUrlCapture()
  })
  const pathname = usePathname() ?? "/"
  const searchParams = useSearchParams()
  const searchKey = searchParams?.toString() ?? ""
  const isOnStakingRoute = isStakingFunnelPathname(pathname)

  const openNotice = useCallback(() => {
    if (!isUnsupportedEnvironment) return
    setIsOpen(true)
  }, [isUnsupportedEnvironment])

  const closeNotice = useCallback(() => {
    setIsOpen(false)
  }, [])

  useLayoutEffect(() => {
    if (!isUnsupportedEnvironment) return
    if (!isOnStakingRoute) return
    const next = refreshStakingTelegramOriginalUrlCapture()
    setPreservedStakingAbsoluteUrl(next)
  }, [isUnsupportedEnvironment, isOnStakingRoute, pathname, searchKey])

  useEffect(() => {
    if (!isUnsupportedEnvironment) return
    if (!isOnStakingRoute) return
    setIsOpen(true)
  }, [isUnsupportedEnvironment, isOnStakingRoute, pathname])

  const api = useMemo<TelegramNoticeApi>(() => {
    if (!isUnsupportedEnvironment) return TELEGRAM_NOTICE_INERT
    return {
      isUnsupportedEnvironment: true,
      isOpen,
      preservedStakingAbsoluteUrl,
      openNotice,
      closeNotice,
    }
  }, [
    isUnsupportedEnvironment,
    isOpen,
    preservedStakingAbsoluteUrl,
    openNotice,
    closeNotice,
  ])

  return (
    <TelegramEscalationContext.Provider value={api}>
      {children}
      {isUnsupportedEnvironment ? (
        <TelegramEscalationDialog
          open={isOpen}
          preservedAbsoluteUrl={preservedStakingAbsoluteUrl}
          onOpenChange={(next) => {
            if (!next) closeNotice()
          }}
          onClose={closeNotice}
        />
      ) : null}
    </TelegramEscalationContext.Provider>
  )
}
