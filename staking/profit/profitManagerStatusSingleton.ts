/**
 * Single shared Firestore subscription for vault profit config (ref-counted).
 */
import { getAffiliateFirestore } from "@/lib/affiliateFirebaseClient"
import {
  fetchStakingVaultProfitStatusFromFirestore,
  subscribeStakingVaultProfitStatus,
  type ProfitManagerStatus,
} from "@/lib/stakingVaultFirestoreProfitStatus"

export type { ProfitManagerStatus }

const FALLBACK: ProfitManagerStatus = {
  apy_percentage: 10,
  share_interval_seconds: 300,
  next_profit_share_at: "",
  last_processed_at: "",
}

export type ProfitManagerStatusSnapshot = {
  data: ProfitManagerStatus
  loading: boolean
  error: Error | null
  hasEverFetchedSuccessfully: boolean
}

let snap: ProfitManagerStatusSnapshot = {
  data: FALLBACK,
  loading: true,
  error: null,
  hasEverFetchedSuccessfully: false,
}

const listeners = new Set<() => void>()
let refCount = 0
let firestoreUnsub: (() => void) | null = null
let lastGood: ProfitManagerStatus = FALLBACK

function emit() {
  for (const cb of listeners) cb()
}

function setSnap(next: ProfitManagerStatusSnapshot) {
  snap = next
  emit()
}

function profitFieldsEqual(a: ProfitManagerStatus, b: ProfitManagerStatus): boolean {
  return (
    a.apy_percentage === b.apy_percentage &&
    a.share_interval_seconds === b.share_interval_seconds &&
    a.next_profit_share_at === b.next_profit_share_at &&
    a.last_processed_at === b.last_processed_at
  )
}

function ensureFirestoreSubscription() {
  if (firestoreUnsub) return
  try {
    const db = getAffiliateFirestore()
    if (!db) return
    firestoreUnsub = subscribeStakingVaultProfitStatus(db, {
      onStatus: next => {
        if (next === null) {
          setSnap({
            data: FALLBACK,
            loading: false,
            error: null,
            hasEverFetchedSuccessfully: false,
          })
          return
        }
        lastGood = next
        const prev = snap.data
        const data = profitFieldsEqual(prev, next) ? prev : next
        setSnap({
          data,
          loading: false,
          error: null,
          hasEverFetchedSuccessfully: true,
        })
      },
      onError: err => {
        setSnap({
          data: lastGood,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          hasEverFetchedSuccessfully: snap.hasEverFetchedSuccessfully,
        })
      },
    })
  } catch (e) {
    setSnap({
      data: lastGood,
      loading: false,
      error: e instanceof Error ? e : new Error(String(e)),
      hasEverFetchedSuccessfully: false,
    })
  }
}

export function subscribeProfitManagerStatus(cb: () => void): () => void {
  listeners.add(cb)
  refCount += 1
  if (refCount === 1) {
    ensureFirestoreSubscription()
  }
  return () => {
    listeners.delete(cb)
    refCount = Math.max(0, refCount - 1)
    if (refCount === 0 && firestoreUnsub) {
      firestoreUnsub()
      firestoreUnsub = null
    }
  }
}

export function getProfitManagerStatusSnapshot(): ProfitManagerStatusSnapshot {
  return snap
}

export function refetchProfitManagerStatusSingleton(): void {
  try {
    const db = getAffiliateFirestore()
    if (!db) return
    void fetchStakingVaultProfitStatusFromFirestore(db)
      .then(parsed => {
        if (parsed === null) {
          setSnap({
            data: FALLBACK,
            loading: false,
            error: null,
            hasEverFetchedSuccessfully: false,
          })
          return
        }
        lastGood = parsed
        const prev = snap.data
        const data = profitFieldsEqual(prev, parsed) ? prev : parsed
        setSnap({
          data,
          loading: false,
          error: null,
          hasEverFetchedSuccessfully: true,
        })
      })
      .catch(e => {
        setSnap({
          data: lastGood,
          loading: false,
          error: e instanceof Error ? e : new Error(String(e)),
          hasEverFetchedSuccessfully: snap.hasEverFetchedSuccessfully,
        })
      })
  } catch (e) {
    setSnap({
      data: lastGood,
      loading: false,
      error: e instanceof Error ? e : new Error(String(e)),
      hasEverFetchedSuccessfully: snap.hasEverFetchedSuccessfully,
    })
  }
}
