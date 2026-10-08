import {
  getAffiliateFirestoreAddressFormat,
  getAffiliateFirestoreDatabaseId,
} from "@/constants/affiliateFirebaseConfig"
import { AFFILIATE_BALANCE_DECIMALS } from "@/constants/affiliateBalanceDecimals"
import { logger } from "@/lib/logger"
import { parseUnits } from "ethers"
import {
  doc,
  getDoc,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore"

export type AffiliateFirestoreStats = {
  uniqueUsers: number
  totalUsd: number
  /** Raw Firestore `total_usd` (or aliases) — display via plain decimal formatter only. */
  totalUsdSource: unknown
  baseBalance: number
  /** Raw Firestore `base_balance` (or aliases) — parsed only via the affiliate fixed-6 pipeline. */
  baseBalanceSource: unknown
}

const AFFILIATE_COLLECTION =
  (
    process.env.NEXT_PUBLIC_STAKING_VAULT_ADDRESS ??
    process.env.VITE_STAKING_VAULT_ADDRESS ??
    ""
  ).toLowerCase()

/** Only these Firestore fields drive affiliate stats (snake_case in DB). */
const AFFILIATE_STATS_FIRESTORE_FIELDS = [
  "unique_users",
  "total_usd",
  "base_balance",
] as const

/** Integer string (optional `-`) = affiliate **micro-units** (10^-6 token), not chain wei. */
const INTEGER_AFFILIATE_MICRO6 = /^-?\d+$/

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

function logAffiliateReadFailure(
  documentId: string,
  error: unknown,
  source: "getDoc" | "onSnapshot",
): void {
  const { code, message } = firebaseErrorFields(error)
  const databaseId = getAffiliateFirestoreDatabaseId()
  const path = `${AFFILIATE_COLLECTION}/${documentId}`
  logger.error(
    source === "getDoc"
      ? "[affiliate-firestore] getDoc failed"
      : "[affiliate-firestore] onSnapshot failed",
    {
      databaseId,
      path,
      code,
      message,
      ...(code === "permission-denied"
        ? {
            hint:
              "Firestore Security Rules are blocking this read (not a bug in the app). " +
              'In Firebase Console → Build → Firestore Database: use the database picker and select "' +
              (databaseId ?? "(default)") +
              '" (NOT "(default)" unless your data lives there) → Rules tab → allow get/list on ' +
              "`affiliates/{affiliateId}` for your use case. Example: `match /affiliates/{id} { allow read: if true; }` " +
              "(tighten for production, e.g. auth or custom claims). Publish rules and retry.",
          }
        : {}),
    },
  )
}

function normalizeAffiliateDocumentId(rawAddress: string): string {
  if (getAffiliateFirestoreAddressFormat() === "checksum") {
    return rawAddress
  }
  return rawAddress.toLowerCase()
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

/**
 * Parses Firestore `base_balance` into **affiliate micro-units** (fixed 10^6 per whole token).
 * - All-digit string (optional `-`) → `BigInt` micro-units (not vault wei).
 * - Decimal / scientific string → `parseUnits` at **AFFILIATE_BALANCE_DECIMALS only**.
 * - Finite `number` → human token amount at 6 dp (`parseUnits` after `toFixed`).
 * - `bigint` → already micro-units.
 */
function parseAffiliateBaseBalanceToAffiliateMicroUnits(raw: unknown): bigint | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === "bigint") {
    return raw
  }
  if (typeof raw === "string") {
    const s = raw.trim().replace(/,/g, "")
    if (!s) return null
    if (INTEGER_AFFILIATE_MICRO6.test(s)) {
      try {
        return BigInt(s)
      } catch {
        return null
      }
    }
    try {
      return parseUnits(s, AFFILIATE_BALANCE_DECIMALS)
    } catch {
      return null
    }
  }
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null
    const dec = Math.min(Math.max(0, AFFILIATE_BALANCE_DECIMALS), 78)
    try {
      return parseUnits(raw.toFixed(dec), AFFILIATE_BALANCE_DECIMALS)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Cost basis from Firestore in **vault token smallest units** (same domain as `balanceOf` /
 * vault `convertToAssets`), by scaling affiliate micro-units (6 dp) to `tokenDecimals`.
 * Does **not** use `tokenDecimals` to parse Firestore — only to scale after the fixed-6 parse.
 */
export function affiliateBaseBalanceToVaultTokenWei(
  raw: unknown,
  tokenDecimals: number,
): bigint | null {
  const micro = parseAffiliateBaseBalanceToAffiliateMicroUnits(raw)
  if (micro === null) return null
  if (!Number.isInteger(tokenDecimals) || tokenDecimals < 0 || tokenDecimals > 78) {
    return null
  }
  const aff = AFFILIATE_BALANCE_DECIMALS
  if (tokenDecimals === aff) {
    return micro
  }
  if (tokenDecimals > aff) {
    return micro * 10n ** BigInt(tokenDecimals - aff)
  }
  return micro / 10n ** BigInt(aff - tokenDecimals)
}

function readBaseBalanceRaw(data: Record<string, unknown> | undefined): unknown {
  if (!data) return undefined
  return (
    data.base_balance ?? data.baseBalance ?? data.base_balance_wei ?? undefined
  )
}

function readTotalUsdRaw(data: Record<string, unknown> | undefined): unknown {
  if (!data) return undefined
  return data.total_usd ?? data.totalUsd ?? undefined
}

/**
 * Maps only `unique_users`, `total_usd`, and `base_balance` (plus camelCase aliases)
 * from a document payload into `AffiliateFirestoreStats`.
 */
function affiliateStatsFromFirestoreFields(
  data: Record<string, unknown> | undefined,
): AffiliateFirestoreStats {
  const uniqueRaw =
    asFiniteNumber(data?.unique_users) ?? asFiniteNumber(data?.uniqueUsers)
  const totalRaw =
    asFiniteNumber(data?.total_usd) ?? asFiniteNumber(data?.totalUsd)
  const uniqueUsers =
    uniqueRaw !== null ? Math.max(0, Math.floor(uniqueRaw)) : 0
  const totalUsd = totalRaw !== null ? Math.max(0, totalRaw) : 0
  const totalUsdSource = readTotalUsdRaw(data)
  const baseBalanceSource = readBaseBalanceRaw(data)
  const baseBalanceNumeric =
    asFiniteNumber(data?.base_balance) ?? asFiniteNumber(data?.baseBalance)
  const baseBalance = baseBalanceNumeric !== null ? baseBalanceNumeric : 0
  return { uniqueUsers, totalUsd, totalUsdSource, baseBalance, baseBalanceSource }
}

/**
 * One document read: `affiliates/{affiliateAddress}`.
 * `affiliateAddress` must match the Firestore document id used by your backend (e.g. checksummed).
 */
export async function fetchAffiliateStats(
  firestore: Firestore,
  affiliateAddress: string,
): Promise<AffiliateFirestoreStats | null> {
  const documentId = normalizeAffiliateDocumentId(affiliateAddress)
  const docRef = doc(firestore, AFFILIATE_COLLECTION, documentId)
  let snap
  try {
    snap = await getDoc(docRef)
  } catch (error) {
    logAffiliateReadFailure(documentId, error, "getDoc")
    throw error
  }
  if (!snap.exists()) {
    return null
  }
  const data = snap.data() as Record<string, unknown> | undefined
  const response = affiliateStatsFromFirestoreFields(data)
  logger.log("[affiliate-firestore] fetchAffiliateStats response", response)
  logger.log("[affiliate-firestore] fetchAffiliateStats raw", {
    unique_users: data?.[AFFILIATE_STATS_FIRESTORE_FIELDS[0]],
    total_usd: data?.[AFFILIATE_STATS_FIRESTORE_FIELDS[1]],
    base_balance: data?.[AFFILIATE_STATS_FIRESTORE_FIELDS[2]],
    documentId,
  })
  return response
}

export type SubscribeAffiliateStatsHandlers = {
  onStats: (stats: AffiliateFirestoreStats | null) => void
  onError?: (error: unknown) => void
}

/**
 * Realtime listener on the same document path as `fetchAffiliateStats`.
 * Only `unique_users`, `total_usd`, and `base_balance` are read from each snapshot.
 * Returns `unsubscribe` for cleanup.
 */
export function subscribeAffiliateStats(
  firestore: Firestore,
  affiliateAddress: string,
  handlers: SubscribeAffiliateStatsHandlers,
): Unsubscribe {
  const documentId = normalizeAffiliateDocumentId(affiliateAddress)
  const docRef = doc(firestore, AFFILIATE_COLLECTION, documentId)

  const unsubscribe = onSnapshot(
    docRef,
    { includeMetadataChanges: false },
    snap => {
      if (!snap.exists()) {
        handlers.onStats(null)
        return
      }
      const data = snap.data() as Record<string, unknown> | undefined
      handlers.onStats(affiliateStatsFromFirestoreFields(data))
    },
    error => {
      logAffiliateReadFailure(documentId, error, "onSnapshot")
      handlers.onError?.(error)
    },
  )

  return unsubscribe
}
