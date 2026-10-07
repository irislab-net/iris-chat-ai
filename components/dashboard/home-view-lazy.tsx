"use client"

import dynamic from "next/dynamic"
import * as React from "react"

import { DashboardSkeleton } from "@/components/dashboard/intel-skeletons"

const HomeView = dynamic(
  () => import("@/components/dashboard/home-view").then((m) => m.HomeView),
  {
    loading: () => (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col">
        <DashboardSkeleton />
      </div>
    ),
  }
)

/**
 * Desk news column — mount HomeView after idle so empty-chat LCP on
 * chat.exur.ai `/` is not competing with the news graph. Dashboard fetches
 * its own tape when `initialNews` is omitted.
 */
export function HomeViewLazy() {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let idleHandle: number | undefined
    let timeoutHandle: number | undefined
    const enable = () => setReady(true)

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(enable, { timeout: 2500 })
    } else {
      timeoutHandle = window.setTimeout(enable, 400)
    }

    return () => {
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle)
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col">
        <DashboardSkeleton />
      </div>
    )
  }

  return <HomeView />
}
