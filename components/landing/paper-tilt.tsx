"use client"

import * as React from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"

/** Degrees at a corner. Small enough to read as paper, not a gadget. */
const MAX_TILT = 5.5
const SPRING = { stiffness: 120, damping: 24, mass: 0.95 }

const BREATHE = {
  duration: 7.2,
  repeat: Infinity,
  ease: "easeInOut" as const,
}

/**
 * Floating sheet: the corner under the cursor sinks back, the far corners
 * lift. The center stays put. A layered ground haze lives under the card
 * and drifts with the press so the shadow feels attached to the paper.
 */
export function PaperTilt({
  children,
  className,
  disableTiltOnCoarsePointer = false,
}: {
  children: React.ReactNode
  className?: string
  /** Phones / touch — skip 3D tilt so the hero desk stays clipped and stable. */
  disableTiltOnCoarsePointer?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const coarsePointer = React.useSyncExternalStore(
    (onStoreChange) => {
      const fine = window.matchMedia("(pointer: fine)")
      fine.addEventListener("change", onStoreChange)
      return () => fine.removeEventListener("change", onStoreChange)
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false
  )
  const tiltOff =
    reduceMotion || (disableTiltOnCoarsePointer && coarsePointer === false)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const nx = useMotionValue(0)
  const ny = useMotionValue(0)
  const sx = useSpring(nx, SPRING)
  const sy = useSpring(ny, SPRING)

  // Cursor at top (ny < 0) → top edge recedes. Cursor at right (nx > 0) →
  // right edge recedes. Opposite of the usual "face the mouse" card tilt.
  const rotateX = useTransform(sy, (v) => v * (MAX_TILT * 2))
  const rotateY = useTransform(sx, (v) => v * -(MAX_TILT * 2))

  // Cast sits on the "table": default drop below, then follows the press
  // so the pool gathers under the receding corner.
  const shadowX = useTransform(sx, (v) => v * 40)
  const shadowY = useTransform(sy, (v) => v * 32 + 22)
  const shadowScale = useTransform([sx, sy], ([x, y]) => {
    const press = Math.min(Math.hypot(Number(x), Number(y)) * 2, 1)
    return 1.04 + press * 0.1
  })

  const reset = React.useCallback(() => {
    nx.set(0)
    ny.set(0)
  }, [nx, ny])

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (tiltOff || event.pointerType !== "mouse") return
      const el = frameRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      nx.set((event.clientX - rect.left) / rect.width - 0.5)
      ny.set((event.clientY - rect.top) / rect.height - 0.5)
    },
    [nx, ny, tiltOff]
  )

  return (
    <div
      ref={frameRef}
      className={cn("relative perspective-[1600px]", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      {tiltOff ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[4%] -z-10 rounded-[2.5rem] bg-foreground/14 opacity-55 blur-3xl dark:bg-foreground/22"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[10%] -z-10 rounded-[2rem] bg-foreground/18 opacity-60 blur-2xl dark:bg-foreground/28"
          />
        </>
      ) : (
        <>
          {/* Ambient haze — slow breath, stays under the whole sheet. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-[6%] -z-10 rounded-[2.5rem] bg-foreground/16 blur-3xl dark:bg-foreground/25"
            animate={{ scale: [1, 1.055, 1], opacity: [0.42, 0.62, 0.42] }}
            transition={BREATHE}
          />

          {/* Contact pool — softer, closer, drifts with the press. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-[14%] -z-10 rounded-[2rem] bg-foreground/20 blur-2xl dark:bg-foreground/30"
            style={{ x: shadowX, y: shadowY, scale: shadowScale }}
            animate={{ opacity: [0.5, 0.72, 0.5] }}
            transition={{ ...BREATHE, duration: 8.4 }}
          />
        </>
      )}

      <motion.div
        className="relative overflow-visible rounded-xl will-change-transform transform-3d"
        style={
          tiltOff
            ? undefined
            : {
                rotateX,
                rotateY,
                transformPerspective: 1600,
                transformOrigin: "50% 50%",
              }
        }
      >
        {/* Tight edge hold so the sheet doesn't float off the haze. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_18px_40px_-18px_rgba(0,0,0,0.28)] dark:shadow-[0_2px_10px_-2px_rgba(255,255,255,0.06),0_20px_48px_-16px_rgba(255,255,255,0.16)]"
        />
        {children}
      </motion.div>
    </div>
  )
}
