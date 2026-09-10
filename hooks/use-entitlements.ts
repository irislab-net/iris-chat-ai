"use client"

import * as React from "react"

import {
  fetchEntitlements,
  tradingAccessFromEntitlements,
  UNRESOLVED_ENTITLEMENTS,
  type EntitlementSnapshot,
} from "@/lib/entitlements"
import type { TradingAccess } from "@/lib/trading/access"

export type EntitlementsState = {
  snapshot: EntitlementSnapshot
  tradingAccess: TradingAccess
  loading: boolean
  refresh: () => Promise<void>
}

/**
 * Entitlements are keyed by the auth state they were fetched under, so a
 * sign-out never leaves the previous session's snapshot readable and both
 * `snapshot` and `loading` can be derived instead of written from an effect.
 */
type Resolved = { authenticated: boolean; snapshot: EntitlementSnapshot }

export function useEntitlements(isAuthenticated: boolean): EntitlementsState {
  const [resolved, setResolved] = React.useState<Resolved | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)

  React.useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    void fetchEntitlements().then((snapshot) => {
      if (!cancelled) setResolved({ authenticated: true, snapshot })
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const refresh = React.useCallback(async () => {
    if (!isAuthenticated) return
    setRefreshing(true)
    try {
      const snapshot = await fetchEntitlements()
      setResolved({ authenticated: true, snapshot })
    } finally {
      setRefreshing(false)
    }
  }, [isAuthenticated])

  const current =
    resolved && resolved.authenticated === isAuthenticated ? resolved : null
  const snapshot = current?.snapshot ?? UNRESOLVED_ENTITLEMENTS
  const loading = isAuthenticated && (current === null || refreshing)

  const tradingAccess = React.useMemo(
    () => tradingAccessFromEntitlements(snapshot),
    [snapshot]
  )

  return { snapshot, tradingAccess, loading, refresh }
}
