"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { useSearchParams } from "next/navigation"

import { buildChatClientContext } from "@/lib/api/chat"
import { usePathname } from "@/i18n/navigation"
import {
  subscribeDeskContextSync,
  type DeskContextSnapshot,
} from "@/lib/paper-trading/desk-context"
import { isAppDeskPath } from "@/lib/site"
import { resolveWorkspaceTab } from "@/lib/workspace-tab"
import type { User } from "@/lib/api/types"

export function useChatClientContext(input: {
  user?: User | null
  isProUser?: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const workspaceTab =
    isAppDeskPath(pathname) ? resolveWorkspaceTab(searchParams.get("tab")) : null
  const [deskContext, setDeskContext] =
    React.useState<DeskContextSnapshot | null>(null)

  React.useEffect(() => subscribeDeskContextSync(setDeskContext), [])

  return React.useMemo(
    () =>
      buildChatClientContext({
        user: input.user,
        isProUser: input.isProUser,
        pathname,
        workspaceTab,
        locale,
        deskContext,
      }),
    [input.user, input.isProUser, deskContext, pathname, workspaceTab, locale]
  )
}

/** Resolve an open position for client-tool handlers (chat aside). */
export function useChatPositionResolver(
  deskContext: DeskContextSnapshot | null
) {
  return React.useCallback(
    (input: { positionId?: string; symbol?: string }) => {
      const positions = deskContext?.openPositions ?? []
      if (input.positionId) {
        const match = positions.find((p) => p.id === input.positionId)
        if (!match) return null
        return {
          id: match.id,
          symbol: match.symbol,
          side: match.side,
          entryPrice: match.entryPrice,
          quantity: match.quantity,
        }
      }
      const key = input.symbol?.trim().toUpperCase()
      if (!key) return null
      const match = positions.find((p) => p.symbol === key)
      if (!match) return null
      return {
        id: match.id,
        symbol: match.symbol,
        side: match.side,
        entryPrice: match.entryPrice,
        quantity: match.quantity,
      }
    },
    [deskContext]
  )
}

export function useDeskContextSnapshot() {
  const [deskContext, setDeskContext] =
    React.useState<DeskContextSnapshot | null>(null)
  React.useEffect(() => subscribeDeskContextSync(setDeskContext), [])
  return deskContext
}
