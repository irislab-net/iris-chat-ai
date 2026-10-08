/**
 * Staking env adapter — rebuilt for Next.js from the USDS `@/config/env` surface.
 * Prefers `NEXT_PUBLIC_*`; falls back to legacy `VITE_*` names for local parity.
 */

function readEnv(key: string): string | undefined {
  const nextKey = key.startsWith("VITE_")
    ? `NEXT_PUBLIC_${key.slice("VITE_".length)}`
    : key.startsWith("NEXT_PUBLIC_")
      ? key
      : `NEXT_PUBLIC_${key}`
  const viteKey = key.startsWith("VITE_")
    ? key
    : key.startsWith("NEXT_PUBLIC_")
      ? `VITE_${key.slice("NEXT_PUBLIC_".length)}`
      : `VITE_${key}`

  const fromNext = process.env[nextKey]
  if (fromNext !== undefined && fromNext !== "") return fromNext
  const fromVite = process.env[viteKey]
  if (fromVite !== undefined && fromVite !== "") return fromVite
  const direct = process.env[key]
  if (direct !== undefined && direct !== "") return direct
  return undefined
}

function readBool(key: string, defaultValue = false): boolean {
  const raw = readEnv(key)?.trim().toLowerCase()
  if (raw === undefined) return defaultValue
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
}

function readInt(key: string, fallback: number): number {
  const raw = readEnv(key)?.trim()
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : fallback
}

function readFloat(key: string, fallback: number): number {
  const raw = readEnv(key)?.trim()
  if (!raw) return fallback
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

/** Debug logging for staking paths. */
export const DEBUG_LOGS = readBool("DEBUG_LOGS", false)

export const REOWN_PROJECT_ID = (readEnv("REOWN_PROJECT_ID") ?? "").trim()

export const STAKING_CHAIN_ID = readInt("STAKING_CHAIN_ID", 1)

export const STAKING_VAULT_ADDRESS = (readEnv("STAKING_VAULT_ADDRESS") ?? "").trim()

export const STAKING_TOKEN_ADDRESS = (
  readEnv("STAKING_TOKEN_ADDRESS") ??
  readEnv("STAKING_VAULT_ADDRESS") ??
  ""
).trim()

export const STAKING_RPC_HTTP_URL = (readEnv("STAKING_RPC_HTTP_URL") ?? "").trim()

export const STAKING_RPC_WS_URL = (readEnv("STAKING_RPC_WS_URL") ?? "").trim()

export const STAKING_EXPLORER_BASE_URL = (
  readEnv("STAKING_EXPLORER_BASE_URL") ?? "https://etherscan.io"
).trim()

export const STAKING_EXPLORER_LABEL = (
  readEnv("STAKING_EXPLORER_LABEL") ?? "Etherscan"
).trim()

export const STAKING_NETWORK_LABEL = (
  readEnv("STAKING_NETWORK_LABEL") ??
  (STAKING_CHAIN_ID === 11155111 ? "Sepolia" : "Ethereum")
).trim()

export const STAKING_TX_HISTORY_ORIGIN = (
  readEnv("STAKING_TX_HISTORY_ORIGIN") ?? ""
).trim()

export const STAKING_DEPLOYMENTS_JSON = (
  readEnv("STAKING_DEPLOYMENTS_JSON") ?? ""
).trim()

export const STAKING_TRON_VAULT_ADDRESS = (
  readEnv("STAKING_TRON_VAULT_ADDRESS") ?? ""
).trim()

export const STAKING_TRON_TOKEN_ADDRESS = (
  readEnv("STAKING_TRON_TOKEN_ADDRESS") ?? ""
).trim()

export const STAKING_TRON_RPC_HTTP_URL = (
  readEnv("STAKING_TRON_RPC_HTTP_URL") ?? ""
).trim()

export const STAKING_TRON_EXPLORER_BASE_URL = (
  readEnv("STAKING_TRON_EXPLORER_BASE_URL") ?? "https://tronscan.org"
).trim()

export const STAKING_TRON_CAIP2 = (readEnv("STAKING_TRON_CAIP2") ?? "").trim()

export const STAKING_TRON_TX_HISTORY_GRID_API_URL = (
  readEnv("STAKING_TRON_TX_HISTORY_GRID_API_URL") ?? ""
).trim()

export const APP_METADATA_URL = (
  readEnv("APP_METADATA_URL") ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://chat.exur.ai"
)
  .trim()
  .replace(/\/$/, "")

export const APP_METADATA_ICON_URL = (
  readEnv("APP_METADATA_ICON_URL") ?? `${APP_METADATA_URL}/favicon.ico`
).trim()

export const FIREBASE_API_KEY = (readEnv("FIREBASE_API_KEY") ?? "").trim()
export const FIREBASE_AUTH_DOMAIN = (readEnv("FIREBASE_AUTH_DOMAIN") ?? "").trim()
export const FIREBASE_PROJECT_ID = (readEnv("FIREBASE_PROJECT_ID") ?? "").trim()
export const FIREBASE_STORAGE_BUCKET = (
  readEnv("FIREBASE_STORAGE_BUCKET") ?? ""
).trim()
export const FIREBASE_MESSAGING_SENDER_ID = (
  readEnv("FIREBASE_MESSAGING_SENDER_ID") ?? ""
).trim()
export const FIREBASE_APP_ID = (readEnv("FIREBASE_APP_ID") ?? "").trim()
export const FIREBASE_MEASUREMENT_ID = (
  readEnv("FIREBASE_MEASUREMENT_ID") ?? ""
).trim()

export const AFFILIATE_FIRESTORE_DATABASE_ID = (
  readEnv("AFFILIATE_FIRESTORE_DATABASE_ID") ?? "(default)"
).trim()

export const AFFILIATE_FIRESTORE_ADDRESS_FORMAT = (
  (readEnv("AFFILIATE_FIRESTORE_ADDRESS_FORMAT") ?? "checksum").trim() ===
  "lowercase"
    ? "lowercase"
    : "checksum"
) as "lowercase" | "checksum"

export function isStakingEthereumEnabled(): boolean {
  return readBool("ENABLE_ETHEREUM", true)
}

export function isStakingTronEnabled(): boolean {
  return readBool("ENABLE_TRON", false)
}

export function isStakingReferralEnabled(): boolean {
  return readBool("STAKING_REFERRAL_ENABLED", false)
}

export function isAppKitTronIdentityEnabled(): boolean {
  return readBool("APPKIT_TRON_IDENTITY", false)
}

export function isRuntimePickerDevEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && readBool("RUNTIME_PICKER_DEV", false)
}

export function isRuntimePickerDevPanelVisible(): boolean {
  return isRuntimePickerDevEnabled()
}

export function isRuntimeChaosSuiteEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && readBool("RUNTIME_CHAOS", false)
}

export function isRuntimeTortureSuiteEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && readBool("RUNTIME_TORTURE", false)
}

export function isRuntimeSwapStressHarnessEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && readBool("RUNTIME_SWAP_STRESS", false)
}

export type RuntimeSwitchRolloutLayer =
  | "disabled"
  | "internal"
  | "canary"
  | "ga"

export function getRuntimeSwitchRolloutLayer(): RuntimeSwitchRolloutLayer {
  const raw = (readEnv("RUNTIME_SWITCH_ROLLOUT") ?? "disabled").trim().toLowerCase()
  if (raw === "internal" || raw === "canary" || raw === "ga") return raw
  return "disabled"
}

export function isRuntimeSwitchExecutionEnabledForInternalUse(): boolean {
  const layer = getRuntimeSwitchRolloutLayer()
  return layer === "internal" || layer === "canary" || layer === "ga"
}

export function getRuntimeTelemetryRolloutStage(): number {
  return readInt("RUNTIME_TELEMETRY_STAGE", 0)
}

export function getRuntimeTelemetrySampleRate(): number {
  return readFloat("RUNTIME_TELEMETRY_SAMPLE_RATE", 0)
}

export function getSentryDsn(): string | null {
  const dsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
    process.env.SENTRY_DSN?.trim() ||
    readEnv("SENTRY_DSN")?.trim()
  return dsn || null
}

export function getSentryRelease(): string | null {
  return (
    process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() ||
    process.env.SENTRY_RELEASE?.trim() ||
    readEnv("SENTRY_RELEASE")?.trim() ||
    null
  )
}

export function getAppBuildId(): string | null {
  return readEnv("APP_BUILD_ID")?.trim() || process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim() || null
}

export function getDeployDeploymentId(): string | null {
  return readEnv("DEPLOYMENT_ID")?.trim() || null
}

export function getRuntimeAssetVersion(): string | null {
  return readEnv("RUNTIME_ASSET_VERSION")?.trim() || null
}

export function getViteBuildHash(): string | null {
  return readEnv("BUILD_HASH")?.trim() || readEnv("VITE_BUILD_HASH")?.trim() || null
}

export function getRecaptchaSiteKey(): string | null {
  return readEnv("RECAPTCHA_SITE_KEY")?.trim() || null
}

export function getFirebaseAppCheckDebugToken(): string | null {
  return readEnv("FIREBASE_APPCHECK_DEBUG_TOKEN")?.trim() || null
}

export function getExpectedChainId(): number {
  return STAKING_CHAIN_ID
}

export function readViteStakingHighNetworkFeeWei(): bigint | null {
  const raw = readEnv("STAKING_HIGH_NETWORK_FEE_WEI")?.trim()
  if (!raw) return null
  try {
    return BigInt(raw)
  } catch {
    return null
  }
}

export function readViteStakingTermsUrl(): string {
  return (
    readEnv("STAKING_TERMS_URL")?.trim() ||
    "/terms"
  )
}
