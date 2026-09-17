"use client"

import * as React from "react"
import { BellRingIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getNotificationPermission,
  requestStanceAlertPermission,
  unlockMarketStanceAudio,
} from "@/lib/market-stance-chime"

function StanceAlertsPermissionDialog() {
  const [open, setOpen] = React.useState(false)
  const [asking, setAsking] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Ask on every visit while the browser still reports "default".
    // Outside-click / "Not now" only closes for this session — not a reject.
    // Skip when already granted, denied, unsupported, or insecure context.
    const permission = getNotificationPermission()
    if (permission !== "default") return
    if (typeof window !== "undefined" && !window.isSecureContext) return

    const id = window.setTimeout(() => setOpen(true), 1200)
    return () => window.clearTimeout(id)
  }, [])

  function closeForNow() {
    if (asking) return
    setOpen(false)
  }

  async function onAllow() {
    setAsking(true)
    setError(null)
    unlockMarketStanceAudio()
    const result = await requestStanceAlertPermission()
    setAsking(false)

    if (result.ok) {
      setOpen(false)
      return
    }

    if (result.reason === "denied") {
      setError(
        "Permission was denied. You can enable notifications later in browser settings."
      )
      return
    }
    if (result.reason === "insecure") {
      setError("Notifications need HTTPS (or localhost).")
      return
    }
    if (result.reason === "unsupported") {
      setError("This browser does not support notifications.")
      return
    }
    setError(result.detail ?? "Could not enable alerts.")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Backdrop / Esc / X just dismisses this session — not a permanent reject.
        if (!next) closeForNow()
        else setOpen(true)
      }}
    >
      <DialogContent
        className="gap-0 overflow-hidden rounded-3xl border-0 p-0 ring-0 sm:max-w-md"
        showCloseButton={!asking}
      >
        <div className="flex flex-col gap-4 px-6 pt-7 pb-2">
          <DialogHeader className="gap-2 text-left">
            <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-muted">
              <BellRingIcon className="size-5 text-foreground" aria-hidden />
            </div>
            <DialogTitle className="text-xl tracking-tight">
              Stance alerts
            </DialogTitle>
            <DialogDescription className="text-pretty text-base leading-relaxed">
              Get a soft chime and an OS notification when the desk flips to{" "}
              <span className="font-medium text-foreground">LONG</span> or{" "}
              <span className="font-medium text-foreground">SHORT</span>, even
              if you&apos;re in another tab.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter className="mx-0 mb-0 flex-col gap-2 rounded-none border-t-0 bg-transparent p-5 pt-3 sm:flex-col sm:justify-stretch">
          <Button
            type="button"
            size="lg"
            className="h-11 w-full rounded-2xl px-4 text-[15px] font-semibold"
            disabled={asking}
            onClick={() => void onAllow()}
          >
            {asking ? "Waiting for browser…" : "Allow alerts"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full rounded-2xl text-muted-foreground hover:text-foreground"
            disabled={asking}
            onClick={closeForNow}
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { StanceAlertsPermissionDialog }
