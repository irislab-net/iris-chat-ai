"use client"

import * as React from "react"

/**
 * Flip to true after the browser is idle (or after `timeoutMs`).
 * Used to keep third-party scripts off the critical path.
 */
export function useIdleReady(enabled: boolean, timeoutMs = 4000) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) {
      setReady(false)
      return
    }

    const idle = window.requestIdleCallback
    if (typeof idle === "function") {
      const handle = idle(() => setReady(true), { timeout: timeoutMs })
      return () => window.cancelIdleCallback(handle)
    }

    const handle = window.setTimeout(() => setReady(true), Math.min(timeoutMs, 2500))
    return () => window.clearTimeout(handle)
  }, [enabled, timeoutMs])

  return ready
}
