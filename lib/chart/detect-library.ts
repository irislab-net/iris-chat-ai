const LIBRARY_SCRIPT = "/charting_library/charting_library.standalone.js"

let cached: boolean | null = null
let inFlight: Promise<boolean> | null = null

function tradingViewLibraryBundled(): boolean {
  return process.env.NEXT_PUBLIC_TRADINGVIEW_LIBRARY === "1"
}

/** Check whether the licensed TradingView Charting Library bundle is hosted. */
export async function detectTradingViewLibrary(): Promise<boolean> {
  if (cached != null) return cached
  if (typeof window === "undefined") return false

  if (!tradingViewLibraryBundled()) {
    cached = false
    return false
  }

  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const res = await fetch(LIBRARY_SCRIPT, { method: "HEAD" })
      cached = res.ok
      return cached
    } catch {
      cached = false
      return false
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

export function getTradingViewLibraryPath(): string {
  return "/charting_library/"
}

export function resetTradingViewLibraryCache(): void {
  cached = null
  inFlight = null
}

export function isTradingViewLibraryBundled(): boolean {
  return tradingViewLibraryBundled()
}
