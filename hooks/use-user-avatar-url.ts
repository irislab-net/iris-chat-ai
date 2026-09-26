"use client"

import * as React from "react"

import type { User } from "@/lib/api/types"
import {
  resolveUserAvatarUrl,
  resolveUserAvatarUrlWithFallback,
} from "@/lib/user-avatar"

function userAvatarKey(user: User | null | undefined) {
  return user?.id ?? user?.email ?? ""
}

export function useUserAvatarUrl(user: User | null | undefined) {
  const directUrl = React.useMemo(() => resolveUserAvatarUrl(user), [user])
  const userKey = userAvatarKey(user)
  const [fallbackState, setFallbackState] = React.useState<{
    key: string
    url: string | null
  }>({ key: "", url: null })

  React.useEffect(() => {
    if (directUrl || !user) return

    let cancelled = false
    void resolveUserAvatarUrlWithFallback(user).then((next) => {
      if (!cancelled) {
        setFallbackState({ key: userKey, url: next })
      }
    })

    return () => {
      cancelled = true
    }
  }, [user, userKey, directUrl])

  const fallbackUrl = fallbackState.key === userKey ? fallbackState.url : null

  return directUrl ?? fallbackUrl
}
