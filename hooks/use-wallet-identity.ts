"use client"

import * as React from "react"

import {
  listLinkedWallets,
  primaryWalletIdentity,
  verifiedWalletAddress,
  walletLifecycleFromIdentity,
  walletReadinessStatus,
  type WalletIdentity,
  type WalletLifecycleState,
  type WalletReadinessStatus,
} from "@/lib/wallet"

export type WalletIdentityState = {
  identity: WalletIdentity | null
  wallets: readonly WalletIdentity[]
  lifecycle: WalletLifecycleState
  verifiedAddress: string | null
  readinessStatus: WalletReadinessStatus
  loading: boolean
  refresh: () => Promise<void>
}

const NO_WALLETS: readonly WalletIdentity[] = []

/**
 * Linked wallets are keyed by the auth state they were fetched under, so a
 * sign-out never leaves the previous session's wallets readable and both
 * `wallets` and `loading` can be derived instead of written from an effect.
 */
type Resolved = { authenticated: boolean; wallets: readonly WalletIdentity[] }

export function useWalletIdentity(isAuthenticated: boolean): WalletIdentityState {
  const [resolved, setResolved] = React.useState<Resolved | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)

  React.useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    void listLinkedWallets()
      .then((response) => {
        if (!cancelled) {
          setResolved({ authenticated: true, wallets: response.wallets })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolved({ authenticated: true, wallets: NO_WALLETS })
        }
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const refresh = React.useCallback(async () => {
    if (!isAuthenticated) return
    setRefreshing(true)
    try {
      const response = await listLinkedWallets()
      setResolved({ authenticated: true, wallets: response.wallets })
    } catch {
      setResolved({ authenticated: true, wallets: NO_WALLETS })
    } finally {
      setRefreshing(false)
    }
  }, [isAuthenticated])

  const current =
    resolved && resolved.authenticated === isAuthenticated ? resolved : null
  const wallets = current?.wallets ?? NO_WALLETS
  const loading = isAuthenticated && (current === null || refreshing)

  const identity = React.useMemo(() => primaryWalletIdentity(wallets), [wallets])
  const lifecycle = walletLifecycleFromIdentity(identity)
  const verifiedAddress = verifiedWalletAddress(identity)
  const readinessStatus = walletReadinessStatus({
    lifecycle,
    address: identity?.address ?? null,
  })

  return {
    identity,
    wallets,
    lifecycle,
    verifiedAddress,
    readinessStatus,
    loading,
    refresh,
  }
}
