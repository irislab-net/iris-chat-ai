"use client"
import { BrandLoadingMark } from "@/components/layout/BrandLoadingMark"
import { useAppKitReady } from "@/hooks/useAppKitReady"
import type { ReactNode } from "react"

/** Blocks route content until AppKit has finished its dynamic import. */
export function AppKitRouteGate({ children }: { children: ReactNode }) {
  const ready = useAppKitReady()
  if (!ready) {
    return (
      <div
        className='flex min-h-[50vh] flex-col items-center justify-center px-4'
        aria-busy
        aria-label='Loading wallet'
      >
        <BrandLoadingMark />
      </div>
    )
  }
  return <>{children}</>
}
