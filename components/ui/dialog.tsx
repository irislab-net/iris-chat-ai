"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { useChatGsapPopup } from "@/hooks/use-chat-gsap-popup"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  const disableInternalBackdropPointers = React.useCallback(
    (node: HTMLDivElement | null) => {
      const internal = node?.previousElementSibling
      if (
        internal instanceof HTMLElement &&
        internal.hasAttribute("data-base-ui-inert") &&
        internal.getAttribute("role") === "presentation" &&
        !internal.hasAttribute("data-slot")
      ) {
        internal.style.pointerEvents = "none"
      }
    },
    []
  )

  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        // Blur on ::before; no isolate — see SheetOverlay / Base UI #2940.
        "fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:before:pointer-events-none supports-backdrop-filter:before:absolute supports-backdrop-filter:before:inset-0 supports-backdrop-filter:before:-z-10 supports-backdrop-filter:before:backdrop-blur-xs supports-backdrop-filter:before:content-[''] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
      ref={disableInternalBackdropPointers}
    />
  )
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogPrimitive.Popup.Props & {
    showCloseButton?: boolean
    /**
     * GSAP scale + opacity (back.out / power2.in) instead of CSS animate-in.
     * Pass the controlled `open` from Dialog root so close tweens can run.
     */
    gsapMotion?: boolean
    open?: boolean
  }
>(function DialogContent(
  {
    className,
    children,
    showCloseButton = true,
    gsapMotion = false,
    open = true,
    ...props
  },
  ref
) {
  const gsapRef = useChatGsapPopup({
    open,
    enabled: gsapMotion,
    transformOrigin: "center center",
    // Base UI owns exit presence; GSAP only handles the enter spring.
    phase: "open-only",
  })

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      gsapRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [gsapRef, ref]
  )

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={setRefs}
        data-slot="dialog-content"
        data-gsap-motion={gsapMotion ? "true" : undefined}
        className={cn(
          // z-51 above the z-50 scrim so iOS hit-testing reaches the dialog
          // (same-z full-screen overlays steal taps — see Sheet stacking).
          "fixed top-1/2 left-1/2 z-51 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
          gsapMotion
            ? "duration-100 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            : "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute inset-e-2 top-2"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
