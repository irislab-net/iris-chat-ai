"use client"

import * as React from "react"
import { useLocale } from "next-intl"

import { buildChatClientContext } from "@/lib/api/chat"
import type { User } from "@/lib/api/types"

export function useChatClientContext(input: {
  user?: User | null
  isProUser?: boolean
}) {
  const locale = useLocale()

  return React.useMemo(
    () =>
      buildChatClientContext({
        user: input.user,
        isProUser: input.isProUser,
        locale,
      }),
    [input.user, input.isProUser, locale]
  )
}
