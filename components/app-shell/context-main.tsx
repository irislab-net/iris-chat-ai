"use client"

import * as React from "react"

import { MAIN_CONTENT_ID } from "@/components/landing/modern/skip-to-content"
import { cn } from "@/lib/utils"

type ContextMainProps = React.ComponentProps<"main">

/**
 * Full-bleed scroll surface. Desk bottom-nav clearance lives on the *content*
 * (`--desk-bottom-nav`), not as padding on this shell — otherwise a solid
 * `bg-background` strip sits behind the floating pill.
 */
function ContextMain({ className, children, ...props }: ContextMainProps) {
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      data-slot="context-main"
      className={cn(
        "relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden outline-none",
        className
      )}
      {...props}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          data-slot="context-source"
          className="flex min-h-full flex-col pb-[calc(var(--desk-bottom-nav,0px)+0.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
        >
          {children}
        </div>
      </div>
    </main>
  )
}

export { ContextMain }
