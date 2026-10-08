"use client"
import { AppKitReadyContext } from "@/contexts/AppKitReadyContext"
import {
  initializeAppKit,
  isAppKitInitCompleted,
} from "@/lib/appKitBootstrap"
import { observeAppKitSessionHydrationOnStartup } from "@/lib/wallet/appKitSessionHydrationObserve"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

/**
 * `ready === true` means `createAppKit()` committed (same as `initializeAppKit()` resolved).
 * Never cleared at runtime. WC recovery does not affect this flag.
 */
export function AppKitReadyProvider({ children }: { children: ReactNode }) {
  const readyLatch = useRef(isAppKitInitCompleted())
  const [ready, setReady] = useState(readyLatch.current)

  useEffect(() => {
    if (readyLatch.current) return

    void initializeAppKit()
      .then(() => {
        if (readyLatch.current) return
        readyLatch.current = true
        setReady(true)
        void observeAppKitSessionHydrationOnStartup()
      })
      .catch(() => {
        /* ready stays false; AppKit bootstrap owns retry UX */
      })
  }, [])

  const value = useMemo(() => ready, [ready])

  return (
    <AppKitReadyContext.Provider value={value}>
      {children}
    </AppKitReadyContext.Provider>
  )
}

