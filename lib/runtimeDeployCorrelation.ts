import * as Sentry from "@sentry/nextjs"
import {
  getAppBuildId,
  getDeployDeploymentId,
  getRuntimeAssetVersion,
  getSentryRelease,
  getViteBuildHash,
} from "@/config/env"
import { isSentryEnabled } from "@/lib/sentry"
import type { StakingCanonicalTags } from "@/lib/stakingSentry/types"

const RUNTIME_BUILD_STORAGE_KEY = "matrix_runtime_app_build_id"

/** Canonical deploy tags for stale-tab vs fresh-deploy correlation in Sentry. */
export function readDeployCorrelationTags(): Pick<
  StakingCanonicalTags,
  "app_build_id" | "vite_build_hash" | "deployment_id" | "runtime_asset_version"
> {
  return {
    app_build_id: getAppBuildId(),
    vite_build_hash: getViteBuildHash(),
    deployment_id: getDeployDeploymentId(),
    runtime_asset_version: getRuntimeAssetVersion(),
  }
}

/** Flat record for breadcrumb `data` payloads. */
export function readDeployCorrelationData(): Readonly<
  Record<string, string>
> {
  const tags = readDeployCorrelationTags()
  return {
    app_build_id: tags.app_build_id ?? "unknown",
    vite_build_hash: tags.vite_build_hash ?? "unknown",
    deployment_id: tags.deployment_id ?? "unknown",
    runtime_asset_version: tags.runtime_asset_version ?? "unknown",
    sentry_release: getSentryRelease() ?? "unknown",
  }
}

/** Apply deploy correlation tags to the active Sentry scope (boot + structured events). */
export function applyDeployCorrelationScopeTags(): void {
  if (!isSentryEnabled()) return
  const tags = readDeployCorrelationTags()
  for (const [key, value] of Object.entries(tags)) {
    if (value == null || value === "") continue
    Sentry.setTag(key, String(value))
  }
}

/**
 * On startup: compare session build id with current. Observability only — no reload.
 */
export function installRuntimeBuildChangeObservation(): void {
  if (typeof window === "undefined") return

  const current = getAppBuildId()
  let previous: string | null = null
  try {
    previous = sessionStorage.getItem(RUNTIME_BUILD_STORAGE_KEY)
  } catch {
    /* private mode */
  }

  if (previous && previous !== current && isSentryEnabled()) {
    Sentry.addBreadcrumb({
      category: "runtime",
      message: "runtime_build_changed",
      level: "info",
      data: {
        previous_build_id: previous,
        current_build_id: current,
        ...readDeployCorrelationData(),
      },
    })
  }

  if (!current) return

  try {
    sessionStorage.setItem(RUNTIME_BUILD_STORAGE_KEY, current)
  } catch {
    /* ignore */
  }
}
