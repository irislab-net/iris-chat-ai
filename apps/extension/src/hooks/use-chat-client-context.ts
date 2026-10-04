"use client"

import * as React from "react"
import { useLocale } from "next-intl"

import { buildChatClientContext } from "@/lib/api/chat"
import type { User } from "@/lib/api/types"
import {
  getTradingProfileSnapshot,
  subscribeTradingProfile,
} from "@/lib/trading-profile"

export function useChatClientContext(input: {
  user?: User | null
  isProUser?: boolean
}) {
  const locale = useLocale()
  const tradingProfile = React.useSyncExternalStore(
    subscribeTradingProfile,
    getTradingProfileSnapshot,
    () => null
  )

  return React.useMemo(
    () =>
      buildChatClientContext({
        user: input.user,
        isProUser: input.isProUser,
        locale,
        tradingProfile,
      }),
    [input.user, input.isProUser, locale, tradingProfile]
  )
}
