"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { useSearchParams } from "next/navigation"

import { buildChatClientContext } from "@/lib/api/chat"
import { usePathname } from "@/i18n/navigation"
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

  return React.useMemo(
    () =>
      buildChatClientContext({
        user: input.user,
        isProUser: input.isProUser,
        pathname,
        workspaceTab,
        locale,
      }),
    [input.user, input.isProUser, pathname, workspaceTab, locale]
  )
}
