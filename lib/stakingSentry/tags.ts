import type * as Sentry from "@sentry/nextjs"
import { getSentryRelease } from "@/config/env"
import { readDeployCorrelationTags } from "@/lib/runtimeDeployCorrelation"
import type { StakingCanonicalTags, StakingSentryTagContext } from "@/lib/stakingSentry/types"

export function readStakingClientEnvironmentTags(): Pick<
  StakingCanonicalTags,
  "mobile" | "browser" | "visibility_state" | "environment" | "release"
> {
  if (typeof navigator === "undefined" || typeof document === "undefined") {
    return {
      mobile: "unknown",
      browser: "unknown",
      visibility_state: "unknown",
      environment: process.env.NODE_ENV,
      release: getSentryRelease() ?? null,
    }
  }
  const ua = navigator.userAgent
  const isMobile = /android|iphone|ipad|mobile/i.test(ua)
  let browser = "other"
  if (/edg\//i.test(ua)) browser = "edge"
  else if (/chrome/i.test(ua)) browser = "chrome"
  else if (/safari/i.test(ua)) browser = "safari"
  else if (/firefox/i.test(ua)) browser = "firefox"

  return {
    mobile: isMobile ? "true" : "false",
    browser,
    visibility_state: document.visibilityState,
    environment: process.env.NODE_ENV,
    release: getSentryRelease() ?? null,
  }
}

export function legacyTagsToCanonical(
  legacy: StakingSentryTagContext
): StakingCanonicalTags {
  return {
    ...(legacy.walletProvider != null ? { wallet_vendor: legacy.walletProvider } : {}),
    ...(legacy.runtimeFamily != null ? { chain_family: legacy.runtimeFamily } : {}),
    ...(legacy.deploymentId != null ? { deployment_id: legacy.deploymentId } : {}),
    ...(legacy.txPhase != null ? { tx_phase: legacy.txPhase } : {}),
    ...(legacy.signerHydration != null ? { signer_state: legacy.signerHydration } : {}),
    ...(legacy.networkMismatch != null
      ? { wrong_network: legacy.networkMismatch ? "true" : "false" }
      : {}),
  }
}

export function applyStakingCanonicalTags(
  scope: Sentry.Scope,
  tags: Partial<StakingCanonicalTags>
): void {
  const envTags = {
    ...readStakingClientEnvironmentTags(),
    ...readDeployCorrelationTags(),
  }
  const merged: StakingCanonicalTags = { ...envTags, ...tags }

  for (const [key, value] of Object.entries(merged)) {
    if (value == null || value === "") continue
    scope.setTag(key, String(value))
  }
}
