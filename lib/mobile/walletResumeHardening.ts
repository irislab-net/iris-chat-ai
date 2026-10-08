/**
 * Soft, minimal resume hardening for the wallet stack. Sits ALONGSIDE the
 * existing `stakingMobileResumeCoordinator` (which handles Radix dialog
 * suppression + staking refresh) and `stakingRefreshOrchestrator` (which
 * refreshes vault data on visibility / pageshow). This module narrows to one
 * concern only: making sure the AppKit ES module reference is alive after a
 * BFCache restore so the wallet hooks have a stable surface to read.
 *
 * Design constraints (per Phase 6 spec):
 *  - No `appKit.reconnect()` — Reown manages WC session restoration via its
 *    internal connector watcher. Forcing reconnect would risk popping the
 *    modal on resume and racing the tx lifecycle.
 *  - No `open()` on visibility/focus — never re-trigger the modal.
 *  - No interference with the controlled tx dialog `open` state.
 *  - No new aggressive reconnect loops; one listener, one idempotent action.
 *  - No regression of: tx lifecycle, modal persistence, mobile resume
 *    suppression window, staking refresh orchestration, Reown defaults.
 *
 * What it does:
 *  - On `pageshow.persisted === true` (real BFCache restore), call
 *    `initializeAppKit()`. Single canonical promise — idempotent after commit.
 *    is a no-op when the module is already loaded. The only case where this
 *    has a side effect is if the host environment evicted the ES module
 *    instance during BFCache, which is rare but documented for iOS Safari.
 *  - Emits one diagnostic trace per pageshow / visibility-visible event so
 *    future Telegram debugging has the same telemetry surface as the staking
 *    lifecycle.
 *
 * The provider mounts this exactly once at app boot. Re-invocations are
 * idempotent via the `installed` flag.
 */

import {
  initializeAppKit,
  isAppKitInitCompleted,
} from "@/lib/appKitBootstrap"
import {
  captureStakingException,
  STAKING_SENTRY_EVENT,
  stakingSentryBreadcrumb,
} from "@/lib/stakingSentry"
import { stakingLifecycleTrace } from "@/staking/diagnostics"

let installed = false

export function installWalletResumeHardening(): void {
  if (installed) return
  if (typeof window === "undefined" || typeof document === "undefined") return
  installed = true

  const onPageShow = (e: PageTransitionEvent) => {
    if (!e.persisted) return
    stakingLifecycleTrace("resume", "wallet_bfcache_restore_nudge", {})
    if (isAppKitInitCompleted()) return
    void initializeAppKit().catch(err => {
      captureStakingException(err, {
        walletProvider: "appkit_bfcache_resume",
        event: STAKING_SENTRY_EVENT.mobile.bfcache_restore_failed,
        contexts: {
          staking_mobile: { resume_kind: "bfcache_pageshow" },
        },
      })
    })
  }

  const onVisibility = () => {
    if (document.visibilityState !== "visible") return
    stakingSentryBreadcrumb("visibility_visible", { source: "wallet_resume_hardening" })
    stakingLifecycleTrace("resume", "wallet_visibility_visible_observation", {})
  }

  window.addEventListener("pageshow", onPageShow)
  document.addEventListener("visibilitychange", onVisibility)
}
