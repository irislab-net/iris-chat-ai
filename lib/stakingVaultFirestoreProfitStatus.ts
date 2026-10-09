import { STAKING_VAULT_ADDRESS } from "@/config/env"
import { getAffiliateFirestoreDatabaseId } from "@/constants/affiliateFirebaseConfig"
import { logger } from "@/lib/logger"
import {
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore"

export type ProfitManagerStatus = {
  apy_percentage: number
  share_interval_seconds: number
  next_profit_share_at: string
  last_processed_at: string
}

const VAULT_COLLECTION_ID = STAKING_VAULT_ADDRESS.toLowerCase()
const CONFIG_DOC_ID = "config"

function firebaseErrorFields(error: unknown): {
  code?: string
  message?: string
} {
  if (typeof error !== "object" || error === null) return {}
  const o = error as Record<string, unknown>
  const code = typeof o.code === "string" ? o.code : undefined
  const message = typeof o.message === "string" ? o.message : undefined
  return { code, message }
}

function logProfitConfigReadFailure(
  error: unknown,
  source: "getDoc" | "onSnapshot",
): void {
  const { code, message } = firebaseErrorFields(error)
  const databaseId = getAffiliateFirestoreDatabaseId()
  const path = `${VAULT_COLLECTION_ID}/${CONFIG_DOC_ID}`
  logger.error(
    source === "getDoc"
      ? "[staking-vault-firestore] profit config getDoc failed"
      : "[staking-vault-firestore] profit config onSnapshot failed",
    {
      databaseId,
      path,
      code,
      message,
      ...(code === "permission-denied"
        ? {
            hint:
              "Firestore Security Rules are blocking this read. In Firebase Console → Firestore → " +
              'pick database "' +
              (databaseId ?? "(default)") +
              '" → Rules → allow get on `' +
              VAULT_COLLECTION_ID +
              "/" +
              CONFIG_DOC_ID +
              "` (e.g. match that path for your client). Publish rules and retry.",
          }
        : {}),
    },
  )
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function firestoreTimeToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }
  if (typeof value === "string") {
    const t = value.trim()
    if (!t) return ""
    const ms = Date.parse(t)
    return Number.isFinite(ms) ? t : ""
  }
  return ""
}

function readApy(data: Record<string, unknown> | undefined): number | null {
  if (!data) return null
  return (
    asFiniteNumber(data.AnnualYieldPercentage) ??
    asFiniteNumber(data.annual_yield_percentage) ??
    asFiniteNumber(data.apy_percentage)
  )
}

function readInterval(data: Record<string, unknown> | undefined): number | null {
  if (!data) return null
  return (
    asFiniteNumber(data.ShareIntervalSeconds) ??
    asFiniteNumber(data.share_interval_seconds)
  )
}

function readNext(data: Record<string, unknown> | undefined): string {
  if (!data) return ""
  return (
    firestoreTimeToIso(data.NextProfitShareAt) ||
    firestoreTimeToIso(data.next_profit_share_at) ||
    ""
  )
}

function readLast(data: Record<string, unknown> | undefined): string {
  if (!data) return ""
  return (
    firestoreTimeToIso(data.LastShareTime) ||
    firestoreTimeToIso(data.last_processed_at) ||
    ""
  )
}

/**
 * Maps `{vault}/config` Firestore fields into `ProfitManagerStatus`.
 * Returns null if required numeric fields are missing or invalid.
 */
export function profitManagerStatusFromFirestoreDoc(
  data: Record<string, unknown> | undefined,
): ProfitManagerStatus | null {
  const apy = readApy(data)
  const interval = readInterval(data)
  if (apy === null || apy < 0 || !Number.isFinite(apy)) return null
  if (interval === null || !Number.isFinite(interval) || interval <= 0) return null
  return {
    apy_percentage: apy,
    share_interval_seconds: Math.min(
      Math.max(Math.round(interval), 60),
      86400,
    ),
    next_profit_share_at: readNext(data),
    last_processed_at: readLast(data),
  }
}

function configDocRef(firestore: Firestore) {
  return doc(firestore, VAULT_COLLECTION_ID, CONFIG_DOC_ID)
}

export type SubscribeStakingVaultProfitStatusHandlers = {
  onStatus: (status: ProfitManagerStatus | null) => void
  onError?: (error: unknown) => void
}

/**
 * Realtime listener on `{STAKING_VAULT_ADDRESS.toLowerCase()}/config`.
 */
export function subscribeStakingVaultProfitStatus(
  firestore: Firestore,
  handlers: SubscribeStakingVaultProfitStatusHandlers,
): Unsubscribe {
  const docRef = configDocRef(firestore)
  return onSnapshot(
    docRef,
    { includeMetadataChanges: false },
    snap => {
      if (!snap.exists()) {
        handlers.onStatus(null)
        return
      }
      const data = snap.data() as Record<string, unknown> | undefined
      const parsed = profitManagerStatusFromFirestoreDoc(data)
      if (!parsed) {
        handlers.onError?.(
          new Error("staking vault config: missing or invalid APY / share interval"),
        )
        return
      }
      handlers.onStatus(parsed)
    },
    error => {
      logProfitConfigReadFailure(error, "onSnapshot")
      handlers.onError?.(error)
    },
  )
}

export async function fetchStakingVaultProfitStatusFromFirestore(
  firestore: Firestore,
): Promise<ProfitManagerStatus | null> {
  let snap
  try {
    snap = await getDoc(configDocRef(firestore))
  } catch (error) {
    logProfitConfigReadFailure(error, "getDoc")
    throw error
  }
  if (!snap.exists()) return null
  const data = snap.data() as Record<string, unknown> | undefined
  return profitManagerStatusFromFirestoreDoc(data)
}
