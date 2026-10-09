import { createContext, useContext } from "react"

/**
 * Telegram in-app browser is treated as an unsupported environment for wallet
 * connection and on-chain transactions. On staking funnel routes the provider
 * persists `window.location.href` (sessionStorage + localStorage) so Copy link
 * and optional `Telegram.WebApp.openLink` use the same full URL the user
 * loaded, including referral query and hash, even if the live location later
 * changes inside the WebView.
 */

export type TelegramNoticeApi = {
  /** True when the current page is rendered inside the Telegram in-app browser. */
  isUnsupportedEnvironment: boolean

  /** Modal-open flag controlled by the provider. */
  isOpen: boolean

  /**
   * Full absolute URL last captured for staking funnel routes inside Telegram.
   * Null outside Telegram or before any capture this session.
   */
  preservedStakingAbsoluteUrl: string | null

  /** Programmatically open the unsupported-environment notice. */
  openNotice: () => void

  /** Programmatically close the notice. */
  closeNotice: () => void
}

const noop = () => {}

/**
 * Inert default consumed when no `TelegramEscalationProvider` is mounted, or
 * when the page is not inside Telegram. Lets `useWallet` call into the context
 * unconditionally with zero cost.
 */
export const TELEGRAM_NOTICE_INERT: TelegramNoticeApi = {
  isUnsupportedEnvironment: false,
  isOpen: false,
  preservedStakingAbsoluteUrl: null,
  openNotice: noop,
  closeNotice: noop,
}

export const TelegramEscalationContext =
  createContext<TelegramNoticeApi>(TELEGRAM_NOTICE_INERT)

export function useTelegramEscalation(): TelegramNoticeApi {
  return useContext(TelegramEscalationContext)
}
