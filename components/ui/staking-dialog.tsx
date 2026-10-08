"use client"
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { shouldDeferInputAutofocusToUser } from "@/lib/inputAutofocusPolicy"
import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  includeOverlay = true,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  overlayClassName?: string
  /** When false, render only the content (e.g. non-modal dialog with a custom backdrop). */
  includeOverlay?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      {includeOverlay ? <DialogOverlay className={overlayClassName} /> : null}
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
        onOpenAutoFocus={e => {
          if (shouldDeferInputAutofocusToUser()) e.preventDefault()
          onOpenAutoFocus?.(e)
        }}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-3 right-3 z-20 flex size-10 shrink-0 items-center justify-center rounded-full",
              "sm:top-3.5 sm:right-3.5 sm:size-7 cursor-pointer hover:bg-white/32 hover:border-white/70 active:scale-[0.94]",
              "border border-white/55 bg-white/22 text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_4px_16px_-6px_rgba(0,0,0,0.18)]",
              "backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-white/18",
              "transition-[transform,background-color,box-shadow,border-color] duration-200 ease-out",
              "hover:bg-white/32 hover:border-white/70 active:scale-[0.94]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "disabled:pointer-events-none",
              "dark:border-white/20 dark:bg-white/12 dark:text-neutral-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_20px_-8px_rgba(0,0,0,0.45)] dark:hover:bg-white/18",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[18px] [&_svg]:stroke-[2.25] sm:[&_svg]:size-[15px]"
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
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
