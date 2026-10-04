"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  viewportRef,
  native = false,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  viewportRef?: React.Ref<HTMLDivElement>
  /**
   * Native overflow scroller — skips Base UI thumb/overflow-edge work that
   * re-renders on every scroll frame. Prefer on long mobile chat threads
   * (iOS WebKit crashes under that load).
   */
  native?: boolean
}) {
  if (native) {
    return (
      <div
        data-slot="scroll-area"
        className={cn("relative", className)}
      >
        <div
          ref={viewportRef}
          data-slot="scroll-area-viewport"
          className="size-full overflow-y-auto overscroll-y-contain outline-none scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        // Overlay bar: Base UI positions this absolutely, so opacity changes
        // never reserve gutter space or shift chat content.
        "flex touch-none select-none data-horizontal:h-1.5 data-horizontal:flex-col data-vertical:h-full data-vertical:w-1.5",
        "pointer-events-none opacity-0 transition-opacity duration-300 ease-out",
        "data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-0",
        "hover:pointer-events-auto hover:opacity-100",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-foreground/20 transition-colors hover:bg-foreground/35"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
