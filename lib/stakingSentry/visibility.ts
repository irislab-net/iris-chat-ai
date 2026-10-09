import { stakingSentryBreadcrumb } from "@/lib/stakingSentry/breadcrumbs"

let installed = false

/** Sparse visibility / BFCache breadcrumbs — one listener set per app boot. */
export function installStakingVisibilityBreadcrumbs(): void {
  if (installed) return
  if (typeof window === "undefined" || typeof document === "undefined") return
  installed = true

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stakingSentryBreadcrumb("visibility_hidden", {})
    } else if (document.visibilityState === "visible") {
      stakingSentryBreadcrumb("visibility_visible", {})
    }
  })

  window.addEventListener("pageshow", (e: PageTransitionEvent) => {
    stakingSentryBreadcrumb("pageshow", { persisted: e.persisted })
  })

  window.addEventListener("pagehide", (e: PageTransitionEvent) => {
    stakingSentryBreadcrumb("pagehide", { persisted: e.persisted })
  })
}
