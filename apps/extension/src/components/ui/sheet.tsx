"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  overlayClassName,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  /** Match elevated sheet stacking (e.g. cookie manage above banner). */
  overlayClassName?: string
}) {
  const isBottom = side === "bottom"

  return (
    <SheetPortal>
      <SheetOverlay
        className={cn(
          // Bottom sheets share the soft liquid scrim (composer tools / mention).
          isBottom &&
            "overscroll-none bg-black/20 supports-backdrop-filter:bg-black/10 supports-backdrop-filter:backdrop-blur-sm dark:bg-black/40 dark:supports-backdrop-filter:bg-black/28",
          overlayClassName
        )}
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col text-sm transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0",
          /**
           * Bottom sheets: transparent shell only.
           * Safari drops `backdrop-filter` when it shares a node with
           * `translateY` enter/exit — the working mention listbox never
           * transforms. Animate opacity here; frost lives on the inner surface.
           */
          isBottom &&
            "inset-x-0 bottom-(--keyboard-inset-bottom,0px) h-auto gap-0 border-0 bg-transparent p-0 shadow-none",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 gap-4 border-l bg-popover bg-clip-padding p-0 text-popover-foreground shadow-lg data-ending-style:translate-x-10 data-starting-style:translate-x-10 sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 gap-4 border-r bg-popover bg-clip-padding p-0 text-popover-foreground shadow-lg data-ending-style:-translate-x-10 data-starting-style:-translate-x-10 sm:max-w-sm",
          side === "top" &&
            "inset-x-0 top-0 h-auto gap-4 border-b bg-popover bg-clip-padding text-popover-foreground shadow-lg data-ending-style:-translate-y-10 data-starting-style:-translate-y-10",
          !isBottom && className
        )}
        {...props}
      >
        {isBottom ? (
          <div
            data-slot="sheet-surface"
            data-side={side}
            className={cn(
              // WebKit: overflow clips backdrop-blur to rounded corners.
              "chat-sheet-glass relative flex w-full flex-col overflow-hidden",
              className
            )}
          >
            {children}
            {showCloseButton ? (
              <SheetPrimitive.Close
                data-slot="sheet-close"
                render={
                  <Button
                    variant="ghost"
                    className="absolute inset-e-5 top-7"
                    size="icon-sm"
                  />
                }
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            ) : null}
          </div>
        ) : (
          <>
            {children}
            {showCloseButton ? (
              <SheetPrimitive.Close
                data-slot="sheet-close"
                render={
                  <Button
                    variant="ghost"
                    className="absolute inset-e-3 top-3"
                    size="icon-sm"
                  />
                }
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            ) : null}
          </>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
