"use client"

import * as React from "react"

import { MAIN_CONTENT_ID } from "@/components/landing/modern/skip-to-content"
import { cn } from "@/lib/utils"

type ContextMainProps = React.ComponentProps<"main">

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
      <div className="flex-1 overflow-y-auto lg:pb-0">
        <div
          data-slot="context-source"
          className="flex h-full min-h-0 flex-col"
        >
          {children}
        </div>
      </div>
    </main>
  )
}

export { ContextMain }
