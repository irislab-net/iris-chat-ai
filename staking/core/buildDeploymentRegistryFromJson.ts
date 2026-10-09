/**
 * Optional **`VITE_STAKING_DEPLOYMENTS_JSON`** ingestion (Phase 16, pure).
 *
 * **Passive only:** parsed rows are **not** executed by staking runtime — `resolveLegacyStakingDeployment()`
 * and live reads stay on the env-built legacy row. Ingestion only fills `deployments[]` for future
 * activation / UI / routing work.
 *
 * **Runtime activation is separate:** registry **containment** ≠ provider or wallet selection.
 *
 * **Ordering (deterministic):**
 * 1. `JSON.parse` (failure → `kind: "malformed"`).
 * 2. Top-level shape check (`{ deployments: unknown[] }`).
 * 3. Per element: coerce → **`normalizeDeployment`** → **`validateDeploymentRowForRegistryShape`**.
 * 4. Drop row if **any `error`-severity** validation issue; record `droppedRows` (DEV consumer may log).
 * 5. Skip rows whose `id` is **`legacy-primary`** (legacy is always pinned from env, never replaced).
 *
 * **Phase 17–18:** Tron-shaped rows may **pass** validation and appear in `deployments[]` — they remain
 * **structurally valid but non-executable** at runtime (`isDeploymentRuntimeExecutable` /
 * `getRuntimeCapabilitiesForDeployment` in `runtimeCapabilities.ts` via `runtimeFamilyDispatch.ts`;
 * registry ingestion ≠ runtime execution).
 *
 * **Soft-fail:** never throw; malformed JSON does not crash startup.
 */
import { normalizeDeployment } from "@/staking/core/normalizeDeployment"
import { deriveProviderRuntimeKey } from "@/staking/core/providerRuntime"
import {
  validateDeploymentRowForRegistryShape,
  deploymentRowHasValidationErrors,
} from "@/staking/core/registryValidation"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import { LEGACY_PRIMARY_DEPLOYMENT_ID } from "@/staking/core/types"

export type BuildDeploymentsFromJsonResult =
  | { readonly kind: "malformed"; readonly detail: string }
  | {
      readonly kind: "ok"
      readonly optionalDeployments: readonly StakingDeploymentConfig[]
      readonly droppedRows: readonly { readonly detail: string }[]
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readTrimmedString(r: Record<string, unknown>, key: string): string | null {
  const v = r[key]
  if (typeof v !== "string") return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

function readOptionalWs(r: Record<string, unknown>): string | null {
  const v = r["ws"]
  if (v === undefined || v === null) return null
  if (typeof v !== "string") return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

function readRpc(r: Record<string, unknown>): { http: string; ws: string | null } | null {
  const obj = r["rpc"]
  if (!isRecord(obj)) return null
  const http = readTrimmedString(obj, "http")
  if (!http) return null
  return { http, ws: readOptionalWs(obj) }
}

function readVault(r: Record<string, unknown>): { address: string } | null {
  const obj = r["vault"]
  if (!isRecord(obj)) return null
  const address = readTrimmedString(obj, "address")
  if (!address) return null
  return { address }
}

function readToken(r: Record<string, unknown>): { address: string } | null {
  const obj = r["token"]
  if (!isRecord(obj)) return null
  const address = readTrimmedString(obj, "address")
  if (!address) return null
  return { address }
}

function readExplorer(r: Record<string, unknown>): { baseUrl: string; label: string } | null {
  const obj = r["explorer"]
  if (!isRecord(obj)) return null
  const baseUrl = readTrimmedString(obj, "baseUrl")
  const label = readTrimmedString(obj, "label")
  if (!baseUrl || !label) return null
  return { baseUrl, label }
}

function readLabels(r: Record<string, unknown>): { network: string } | null {
  const obj = r["labels"]
  if (!isRecord(obj)) return null
  const network = readTrimmedString(obj, "network")
  if (!network) return null
  return { network }
}

function coerceDeploymentRow(x: unknown): StakingDeploymentConfig | null {
  if (!isRecord(x)) return null
  const id = readTrimmedString(x, "id")
  const chainFamilyRaw = readTrimmedString(x, "chainFamily")
  const caip2 = readTrimmedString(x, "caip2")
  const rpc = readRpc(x)
  const vault = readVault(x)
  const token = readToken(x)
  const explorer = readExplorer(x)
  const labels = readLabels(x)
  if (!id || !chainFamilyRaw || !caip2 || !rpc || !vault || !token || !explorer || !labels) {
    return null
  }

  return {
    id,
    chainFamily: chainFamilyRaw as StakingDeploymentConfig["chainFamily"],
    caip2,
    vault,
    token,
    rpc,
    explorer,
    labels,
  }
}

/**
 * Parses optional deployments JSON. Does not instantiate providers or read wallet state.
 *
 * - **`kind: "malformed"`** — parse error or invalid top-level shape (caller should use legacy-only).
 * - **`kind: "ok"`** — `optionalDeployments` are normalized, individually valid rows (may be empty).
 */
export function buildDeploymentRegistryFromJson(raw: string | null): BuildDeploymentsFromJsonResult {
  if (raw === null || raw.trim() === "") {
    return { kind: "ok", optionalDeployments: [], droppedRows: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { kind: "malformed", detail: `JSON.parse failed: ${msg}` }
  }

  if (!isRecord(parsed)) {
    return { kind: "malformed", detail: "root must be a JSON object" }
  }

  const depRaw = parsed["deployments"]
  if (!Array.isArray(depRaw)) {
    return { kind: "malformed", detail: "missing or invalid deployments array" }
  }

  const optionalDeployments: StakingDeploymentConfig[] = []
  const droppedRows: { detail: string }[] = []
  const legacyId = LEGACY_PRIMARY_DEPLOYMENT_ID.trim()

  for (let i = 0; i < depRaw.length; i += 1) {
    const item = depRaw[i]
    const coerced = coerceDeploymentRow(item)
    if (!coerced) {
      droppedRows.push({ detail: `index ${i}: invalid shape or missing required fields` })
      continue
    }

    const normalized = normalizeDeployment(coerced)
    if (normalized.id.trim() === legacyId) {
      droppedRows.push({ detail: `index ${i}: id "${legacyId}" is reserved for env legacy row` })
      continue
    }

    const rowValidation = validateDeploymentRowForRegistryShape(normalized)
    if (deploymentRowHasValidationErrors(rowValidation)) {
      const codes =
        rowValidation.ok === false
          ? rowValidation.issues.filter(x => x.severity === "error").map(x => x.code)
          : []
      droppedRows.push({
        detail: `index ${i} id "${normalized.id}": validation errors: ${codes.join(", ") || "unknown"}`,
      })
      continue
    }

    optionalDeployments.push(normalized)
  }

  return { kind: "ok", optionalDeployments, droppedRows }
}

/**
 * Pure: append rows that do not duplicate an existing `deriveProviderRuntimeKey` in `usedKeys`
 * (mutates a copy of `usedKeys` is avoided — returns new sets via output only).
 */
export function filterDuplicateRuntimeKeysAgainst(
  usedKeys: ReadonlySet<string>,
  rows: readonly StakingDeploymentConfig[]
): { readonly accepted: StakingDeploymentConfig[]; readonly dropped: readonly { detail: string }[] } {
  const accepted: StakingDeploymentConfig[] = []
  const dropped: { detail: string }[] = []
  const seen = new Set(usedKeys)

  for (const row of rows) {
    const key = deriveProviderRuntimeKey(row)
    if (seen.has(key)) {
      dropped.push({
        detail: `id "${row.id.trim()}": duplicate runtime key "${key}" — dropped to avoid providerRegistry corruption`,
      })
      continue
    }
    seen.add(key)
    accepted.push(row)
  }

  return { accepted, dropped }
}