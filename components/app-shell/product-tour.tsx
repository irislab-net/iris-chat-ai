"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useIsDesktop } from "@/hooks/use-media-query"
import { trackProductTour } from "@/lib/analytics"
import {
  MOBILE_PRODUCT_TOUR_STEPS,
  PRODUCT_TOUR_STEPS,
  TOUR_SECTION_LABELS,
  type TourStep,
} from "@/lib/product-tour"
import { cn } from "@/lib/utils"

type ProductTourProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrepareStep?: (step: TourStep) => void | Promise<void>
  /** How the tour was opened — used for analytics only. */
  trigger?: "auto" | "manual"
}

type SpotRect = {
  top: number
  left: number
  width: number
  height: number
}

type CardPos = {
  top: number
  left: number
}

const PAD = 10
const CARD_GAP = 14
const MEASURE_RETRIES = 14
const MEASURE_RETRY_MS = 90

function cardWidth() {
  return Math.min(380, Math.max(260, window.innerWidth - 24))
}

function measureTarget(selector: string): SpotRect | null {
  const elements = document.querySelectorAll(selector)
  for (const node of elements) {
    const el = node as HTMLElement
    const rect = el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) continue
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    }
  }
  return null
}

function placeCard(
  spot: SpotRect,
  placement: TourStep["placement"],
  cardHeight: number,
  width: number
): CardPos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const spotBottom = spot.top + spot.height
  const spotRight = spot.left + spot.width
  const centerX = spot.left + spot.width / 2

  const clampX = (x: number) =>
    Math.min(Math.max(12, x), vw - width - 12)
  const clampY = (y: number) =>
    Math.min(Math.max(12, y), vh - cardHeight - 12)

  const candidates: Record<string, CardPos> = {
    bottom: {
      top: spotBottom + PAD + CARD_GAP,
      left: clampX(centerX - width / 2),
    },
    top: {
      top: spot.top - PAD - CARD_GAP - cardHeight,
      left: clampX(centerX - width / 2),
    },
    right: {
      top: clampY(spot.top + spot.height / 2 - cardHeight / 2),
      left: spotRight + PAD + CARD_GAP,
    },
    left: {
      top: clampY(spot.top + spot.height / 2 - cardHeight / 2),
      left: spot.left - PAD - CARD_GAP - width,
    },
  }

  const order =
    placement && placement !== "auto"
      ? [placement, "bottom", "top", "right", "left"]
      : ["bottom", "top", "right", "left"]

  for (const key of order) {
    const pos = candidates[key]
    if (!pos) continue
    const fitsX = pos.left >= 8 && pos.left + width <= vw - 8
    const fitsY = pos.top >= 8 && pos.top + cardHeight <= vh - 8
    if (fitsX && fitsY) return { top: clampY(pos.top), left: clampX(pos.left) }
  }

  return {
    top: clampY(Math.min(spotBottom + PAD + CARD_GAP, vh - cardHeight - 12)),
    left: clampX(centerX - width / 2),
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function ProductTour({
  open,
  onOpenChange,
  onPrepareStep,
  trigger = "manual",
}: ProductTourProps) {
  const isDesktop = useIsDesktop()
  const isMobile = isDesktop === false
  const [index, setIndex] = React.useState(0)
  const [spot, setSpot] = React.useState<SpotRect | null>(null)
  const [cardPos, setCardPos] = React.useState<CardPos>({ top: 24, left: 24 })
  const [prevOpen, setPrevOpen] = React.useState(open)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const closeTour = React.useCallback(
    (reason: "complete" | "dismiss") => {
      trackProductTour(reason, { trigger, step: index })
      onOpenChange(false)
    },
    [index, onOpenChange, trigger]
  )

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const steps = isMobile ? MOBILE_PRODUCT_TOUR_STEPS : PRODUCT_TOUR_STEPS
  const step = steps[index]
  const isLast = index >= steps.length - 1

  if (open !== prevOpen) {
    setPrevOpen(open)
    setIndex(0)
    setSpot(null)
  }

  if (index > steps.length - 1 && steps.length > 0) {
    setIndex(steps.length - 1)
  }

  const syncLayout = React.useEffectEvent(async () => {
    if (!open || !step) return

    await onPrepareStep?.(step)

    const elements = document.querySelectorAll(step.selector)
    const el = elements.length
      ? (Array.from(elements).find((node) => {
          const rect = (node as HTMLElement).getBoundingClientRect()
          return rect.width >= 2 && rect.height >= 2
        }) as HTMLElement | undefined)
      : null
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      })
    }

    let next: SpotRect | null = null
    for (let attempt = 0; attempt < MEASURE_RETRIES; attempt++) {
      if (attempt > 0) await wait(MEASURE_RETRY_MS)
      next = measureTarget(step.selector)
      if (next) break
    }

    setSpot(next)

    if (isMobile) return

    const width = cardWidth()
    const cardHeight = cardRef.current?.offsetHeight ?? 180
    if (next) {
      setCardPos(placeCard(next, step.placement, cardHeight, width))
    } else {
      setCardPos({
        top: Math.max(24, window.innerHeight / 2 - 90),
        left: Math.max(12, (window.innerWidth - width) / 2),
      })
    }
  })

  React.useEffect(() => {
    if (!open) return

    const frame = window.requestAnimationFrame(() => {
      void syncLayout()
    })

    const onResize = () => void syncLayout()
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize, true)
    }
  }, [open, index, step, isMobile])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTour("dismiss")
        return
      }
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault()
        if (isLast) closeTour("complete")
        else setIndex((i) => Math.min(i + 1, steps.length - 1))
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setIndex((i) => Math.max(i - 1, 0))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, isLast, closeTour, steps.length])

  if (!mounted || !open || !step) return null

  const card = (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            {TOUR_SECTION_LABELS[step.section]}
          </p>
          <p className="mb-1.5 font-mono text-xs tracking-[0.12em] text-muted-foreground/80 uppercase">
            Step {index + 1} of {steps.length}
          </p>
          <h2
            id="product-tour-title"
            className="text-lg leading-snug font-semibold tracking-tight text-foreground"
          >
            {step.title}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close tour"
          onClick={() => closeTour("dismiss")}
        >
          <XIcon />
        </Button>
      </div>

      <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        {step.body}
      </p>

      <div className="mt-4 flex items-center gap-1.5">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to step ${i + 1}: ${s.title}`}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i === index
                ? "bg-foreground"
                : "bg-muted-foreground/25 hover:bg-muted-foreground/40"
            )}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => closeTour("dismiss")}
          >
            Skip tour
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (isLast) closeTour("complete")
              else setIndex((i) => i + 1)
            }}
          >
            {isLast ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </>
  )

  return createPortal(
    <div
      data-slot="product-tour"
      data-mobile={isMobile ? "true" : undefined}
      className="pointer-events-none fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
    >
      <div className="pointer-events-auto absolute inset-0" aria-hidden>
        {spot ? (
          <div
            className={cn(
              "absolute transition-[top,left,width,height] duration-300 ease-out",
              isMobile
                ? "rounded-xl ring-2 ring-background/90"
                : "rounded-2xl ring-2 ring-background/80"
            )}
            style={{
              top: spot.top - PAD,
              left: spot.left - PAD,
              width: spot.width + PAD * 2,
              height: spot.height + PAD * 2,
              boxShadow: isMobile
                ? "0 0 0 9999px color-mix(in oklch, var(--foreground) 44%, transparent)"
                : "0 0 0 9999px color-mix(in oklch, var(--foreground) 38%, transparent)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-foreground/35" />
        )}
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          aria-label="Close tour"
          onClick={() => onOpenChange(false)}
        />
      </div>

      {isMobile ? (
        <div
          ref={cardRef}
          className={cn(
            "pointer-events-auto absolute inset-x-0 bottom-0 z-[81]",
            "rounded-t-3xl bg-popover px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-popover-foreground",
            "shadow-[0_-12px_40px_color-mix(in_oklch,var(--foreground)_12%,transparent)]",
            "animate-in fade-in-0 slide-in-from-bottom-4 duration-250"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/25" />
          {card}
        </div>
      ) : (
        <div
          ref={cardRef}
          className={cn(
            "pointer-events-auto absolute z-[81] w-[min(100vw-1.5rem,24rem)] max-w-[calc(100vw-1.5rem)]",
            "rounded-2xl border border-border/80 bg-popover p-4 text-popover-foreground shadow-2xl sm:p-5",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}
          style={{ top: cardPos.top, left: cardPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {card}
        </div>
      )}
    </div>,
    document.body
  )
}

export { ProductTour }
