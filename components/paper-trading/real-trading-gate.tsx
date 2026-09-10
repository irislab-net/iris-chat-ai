"use client"

import { BellRingIcon, CheckIcon } from "lucide-react"

import { GoogleGlyph } from "@/components/auth/google-glyph"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useWishlistTopic } from "@/hooks/use-wishlist-topic"
import { WISHLIST_TOPIC_TRADING_VIEW } from "@/lib/api/wishlist"
import { cn } from "@/lib/utils"

type RealTradingWishlistDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isAuthenticated: boolean
  loginPending?: boolean
  onLogin?: () => void
}

function RealTradingWishlistDialog({
  open,
  onOpenChange,
  isAuthenticated,
  loginPending,
  onLogin,
}: RealTradingWishlistDialogProps) {
  const wishlist = useWishlistTopic(
    WISHLIST_TOPIC_TRADING_VIEW,
    open && isAuthenticated
  )
  const showLogin = !isAuthenticated && onLogin != null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="relative border-b border-border/60 bg-linear-to-b from-muted/30 to-background px-6 pt-6 pb-5 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-2 h-20 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--foreground)_7%,transparent),transparent)]"
          />
          <Badge
            variant="outline"
            className="relative mb-3 rounded-full px-2.5 text-[10px] tracking-wide uppercase"
          >
            Coming soon
          </Badge>
          <DialogHeader className="items-center gap-2 text-center">
            <DialogTitle className="text-lg tracking-tight">
              Trade for real from this desk
            </DialogTitle>
            <DialogDescription className="max-w-sm text-center text-xs leading-relaxed">
              Think you&apos;d open live positions here? Join the waitlist —
              we&apos;ll turn on real trading in this workspace when the tools
              are ready.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 py-5">
          {wishlist.error ? (
            <p className="text-center text-xs text-destructive">{wishlist.error}</p>
          ) : null}

          {showLogin ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={loginPending}
              onClick={onLogin}
            >
              <GoogleGlyph className="size-3.5" />
              {loginPending ? "Connecting…" : "Sign in to join waitlist"}
            </Button>
          ) : wishlist.loading ? (
            <Button type="button" className="w-full sm:w-auto" disabled>
              Checking waitlist…
            </Button>
          ) : wishlist.subscribed ? (
            <>
              <Badge
                className={cn(
                  "gap-1 rounded-full px-3 py-1 text-xs font-medium",
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}
              >
                <CheckIcon className="size-3.5" />
                You&apos;re on the waitlist
              </Badge>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                We&apos;ll enable live trading here first — no spam, just the
                launch note.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={wishlist.pending}
                onClick={() => void wishlist.unsubscribe()}
              >
                Leave waitlist
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={wishlist.pending}
              onClick={() => void wishlist.subscribe()}
            >
              <BellRingIcon data-icon="inline-start" />
              {wishlist.pending ? "Joining…" : "Join waitlist"}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={() => onOpenChange(false)}
          >
            Keep practicing on Demo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { RealTradingWishlistDialog }
