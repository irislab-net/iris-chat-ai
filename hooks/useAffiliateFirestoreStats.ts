import { getAffiliateFirestore } from "@/lib/affiliateFirebaseClient"
import {
  fetchAffiliateStats,
  subscribeAffiliateStats,
  type AffiliateFirestoreStats,
} from "@/lib/affiliateFirestoreStats"
import { getAddress, isAddress } from "ethers"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const CACHE_TTL_MS = 90_000

type CacheEntry = { stats: AffiliateFirestoreStats; expiresAt: number }

const memoryCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<AffiliateFirestoreStats | null>>()

function cacheKey(docId: string): string {
  return docId.toLowerCase()
}

function readCache(key: string): AffiliateFirestoreStats | null {
  const row = memoryCache.get(key)
  if (!row) return null
  if (Date.now() >= row.expiresAt) {
    memoryCache.delete(key)
    return null
  }
  return row.stats
}

function writeCache(key: string, stats: AffiliateFirestoreStats | null): void {
  if (stats === null) {
    memoryCache.delete(key)
    return
  }
  memoryCache.set(key, { stats, expiresAt: Date.now() + CACHE_TTL_MS })
}

function baseBalanceSourceFingerprint(source: unknown): string {
  if (source === null) return "null"
  if (source === undefined) return "undefined"
  if (typeof source === "bigint") return `b:${source.toString()}`
  if (typeof source === "string" || typeof source === "number" || typeof source === "boolean") {
    return `${typeof source}:${String(source)}`
  }
  try {
    return `j:${JSON.stringify(source)}`
  } catch {
    return "x"
  }
}

function statsShallowEqual(
  a: AffiliateFirestoreStats | null,
  b: AffiliateFirestoreStats | null,
): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  return (
    a.baseBalance === b.baseBalance &&
    a.totalUsd === b.totalUsd &&
    a.uniqueUsers === b.uniqueUsers &&
    baseBalanceSourceFingerprint(a.baseBalanceSource) ===
      baseBalanceSourceFingerprint(b.baseBalanceSource) &&
    baseBalanceSourceFingerprint(a.totalUsdSource) ===
      baseBalanceSourceFingerprint(b.totalUsdSource)
  )
}

async function loadStats(docId: string): Promise<AffiliateFirestoreStats | null> {
  const key = cacheKey(docId)
  const cached = readCache(key)
  if (cached) {
    return cached
  }

  const pending = inflight.get(key)
  if (pending) {
    return pending
  }

  const db = getAffiliateFirestore()
  if (!db) return null

  const promise = fetchAffiliateStats(db, docId)
    .then(result => {
      writeCache(key, result)
      return result
    })
    .finally(() => {
      inflight.delete(key)
    })
  inflight.set(key, promise)
  return promise
}

export type UseAffiliateFirestoreStatsResult = {
  configured: boolean
  loading: boolean
  error: string | null
  stats: AffiliateFirestoreStats | null
  refetch: () => Promise<void>
}

/**
 * Fetches `affiliates/{address}` (checksummed EVM id when possible) with TTL cache and in-flight dedupe.
 */
export function useAffiliateFirestoreStats(
  address: string | undefined
): UseAffiliateFirestoreStatsResult {
  const configured = true
  const docId = useMemo(() => {
    if (!address || !isAddress(address)) return null
    try {
      return getAddress(address)
    } catch {
      return null
    }
  }, [address])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AffiliateFirestoreStats | null>(null)
  const requestIdRef = useRef(0)

  const runFetch = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!configured || !docId) {
        setLoading(false)
        setError(null)
        setStats(null)
        return
      }
      const key = cacheKey(docId)
      if (!opts?.force) {
        const cached = readCache(key)
        if (cached) {
          setStats(prev => (statsShallowEqual(prev, cached) ? prev : cached))
          setError(null)
          setLoading(false)
          return
        }
      }

      const requestId = ++requestIdRef.current
      setLoading(true)
      setError(null)
      try {
        if (opts?.force) {
          memoryCache.delete(key)
          inflight.delete(key)
        }
        const result = await loadStats(docId)
        if (requestId !== requestIdRef.current) return
        setStats(prev => (statsShallowEqual(prev, result) ? prev : result))
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        const message = e instanceof Error ? e.message : "Failed to load affiliate stats"
        setError(message)
        setStats(null)
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    },
    [configured, docId]
  )

  useEffect(() => {
    if (!configured || !docId) {
      setLoading(false)
      setError(null)
      setStats(null)
      return
    }

    const db = getAffiliateFirestore()
    if (!db) {
      setLoading(false)
      setError(null)
      setStats(null)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeAffiliateStats(db, docId, {
      onStats: next => {
        writeCache(cacheKey(docId), next)
        setStats(prev => (statsShallowEqual(prev, next) ? prev : next))
        setError(null)
        setLoading(false)
      },
      onError: err => {
        const message = err instanceof Error ? err.message : "Failed to load affiliate stats"
        setError(message)
        setStats(null)
        setLoading(false)
      },
    })

    return unsubscribe
  }, [configured, docId])

  const refetch = useCallback(async () => {
    await runFetch({ force: true })
  }, [runFetch])

  return {
    configured,
    loading,
    error,
    stats,
    refetch,
  }
}
