import { walletDeepLinkTelemetry } from "@/lib/wallet/walletDeepLinkTelemetry"

const RELOAD_GUARD_KEY = "matrix_stale_chunk_reload_v1"
const RELOAD_GUARD_MS = 60_000

/** In-memory fallback when sessionStorage is unavailable (Safari private mode, ITP). */
let inMemoryReloadGuardAtMs: number | null = null

function collectErrorText(error: unknown): string {
  try {
    if (error instanceof Error) {
      return `${error.name} ${error.message}`
    }
    return String(error ?? "")
  } catch {
    return ""
  }
}

/** MIME / chunk failures when Cloudflare Pages serves index.html for missing hashed assets. */
export function isStaleChunkLoadError(error: unknown): boolean {
  try {
    const text = collectErrorText(error)
    if (!text.trim()) return false
    return (
      /text\/html.*not a valid javascript mime type/i.test(text) ||
      /not a valid javascript mime type/i.test(text) ||
      /failed to fetch dynamically imported module/i.test(text) ||
      /loading chunk [\w-]+ failed/i.test(text) ||
      /chunkloaderror/i.test(text) ||
      /importing a module script failed/i.test(text) ||
      /expected a javascript module script/i.test(text)
    )
  } catch {
    return false
  }
}

function reloadGuardAllows(): boolean {
  const now = Date.now()
  if (inMemoryReloadGuardAtMs != null && now - inMemoryReloadGuardAtMs < RELOAD_GUARD_MS) {
    return false
  }
  try {
    const raw = sessionStorage.getItem(RELOAD_GUARD_KEY)
    if (!raw) return true
    const at = Number(raw)
    return !Number.isFinite(at) || now - at >= RELOAD_GUARD_MS
  } catch {
    return inMemoryReloadGuardAtMs == null || now - inMemoryReloadGuardAtMs >= RELOAD_GUARD_MS
  }
}

function markReloadGuard(): void {
  const now = Date.now()
  inMemoryReloadGuardAtMs = now
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now))
  } catch {
    /* private mode / disabled storage — in-memory guard only */
  }
}

async function clearRuntimeCaches(): Promise<void> {
  if (typeof caches === "undefined") return
  try {
    const keys = await caches.keys()
    await Promise.all(keys.map(key => caches.delete(key)))
  } catch {
    /* ignore */
  }
}

function guardedHardReload(reason: string): void {
  try {
    if (!reloadGuardAllows()) return
    markReloadGuard()
    walletDeepLinkTelemetry("stale_chunk_recovery", {
      reason,
      recovery: "guarded_reload",
    })
    void clearRuntimeCaches()
      .catch(() => undefined)
      .finally(() => {
        try {
          window.location.reload()
        } catch {
          /* never throw from recovery */
        }
      })
  } catch {
    /* never throw from recovery */
  }
}

export function tryRecoverFromStaleChunkError(
  error: unknown,
  reason: string
): boolean {
  try {
    if (!isStaleChunkLoadError(error)) return false
    guardedHardReload(reason)
    return true
  } catch {
    return false
  }
}

/** One guarded full reload on stale Vite chunk / MIME failures (production SPA deploy skew). */
export function installStaleChunkRecovery(): void {
  if (typeof window === "undefined") return

  window.addEventListener("unhandledrejection", event => {
    try {
      if (!isStaleChunkLoadError(event.reason)) return
      event.preventDefault()
      tryRecoverFromStaleChunkError(event.reason, "unhandledrejection")
    } catch {
      /* ignore */
    }
  })

  window.addEventListener(
    "error",
    event => {
      try {
        const err = event.error ?? event.message
        if (!isStaleChunkLoadError(err)) return
        tryRecoverFromStaleChunkError(err, "window_error")
      } catch {
        /* ignore */
      }
    },
    true
  )

  window.addEventListener("vite:preloadError", (event: Event) => {
    try {
      const e = event as Event & { preventDefault?: () => void }
      e.preventDefault?.()
      tryRecoverFromStaleChunkError(
        new Error("vite_preload_error"),
        "vite_preload"
      )
    } catch {
      /* ignore */
    }
  })
}
