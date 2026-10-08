"use client"
import { cn } from "@/lib/utils"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import React, { useRef } from "react"
import { Button } from "../ui/button"

/** Baseline wrapper opacity when `persistentGlow` is on (same rainbow layer; room to intensify on hover). */
const PERSIST_GLOW_BASE_OPACITY = 0.52
const PERSIST_GLOW_HOVER_OPACITY = 1
/** Transient hover flash: rim past opaque fill. */
const GLOW_EDGE_PX = 4
/** Ready (persistent) baseline: slightly wider rim than transient so the halo reads clearer. */
const PERSIST_GLOW_BASE_EDGE_PX = 6
/** Ready + hover: a bit more than baseline so intensity still pops. */
const PERSIST_GLOW_HOVER_EDGE_PX = 8
/** Auto loop: thinner rim + softer peak so navbar pills stay refined. */
const LOOP_GLOW_BASE_EDGE_PX = 3
const LOOP_GLOW_PEAK_EDGE_PX = 5
const LOOP_GLOW_BASE_OPACITY = 0.45
const LOOP_GLOW_PEAK_OPACITY = 0.72

type GlowingButtonProps = React.ComponentProps<typeof Button> & {
  buttonClassName?: string
  showBadge?: boolean
  /**
   * When true (and not disabled/showBadge), the same rainbow glow stays visible at a
   * stable baseline; hover only intensifies opacity/scale — no fade-to-zero choreography.
   */
  persistentGlow?: boolean
  /**
   * Continuous pulsing glow (repeat/yoyo). No hover handlers — use on homepage infinity
   * brand moments or other always-on accents.
   */
  loopGlow?: boolean
  /**
   * Glow shell only — pass the interactive control (e.g. NavigationMenuTrigger + Button)
   * as children so Radix does not merge trigger classes onto this wrapper.
   */
  asGlowShell?: boolean
}

const GlowingButton = React.forwardRef<HTMLDivElement, GlowingButtonProps>(
  function GlowingButton(
  {
    buttonClassName,
    className,
    children,
    showBadge = false,
    persistentGlow = false,
    loopGlow = false,
    asGlowShell = false,
    disabled,
    ...props
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node
    if (typeof ref === "function") {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  useGSAP(
    () => {
      const container = containerRef.current
      const glow = glowRef.current

      if (!container || !glow) return

      const measured = { w: 0, h: 0 }

      const measureTarget = () =>
        container.querySelector<HTMLElement>(
          '[data-slot="button"], [data-slot="navigation-menu-trigger"]'
        ) ?? container

      const syncSize = () => {
        const r = measureTarget().getBoundingClientRect()
        measured.w = r.width
        measured.h = r.height
      }

      function readSize() {
        syncSize()
        let bw = measured.w
        let bh = measured.h
        if (bw <= 1 || bh <= 1) {
          const buttonRect = measureTarget().getBoundingClientRect()
          bw = buttonRect.width
          bh = buttonRect.height
          measured.w = bw
          measured.h = bh
        }
        return { bw, bh }
      }

      const resetGlowTransform = () => {
        gsap.set(glow, {
          scaleX: 1,
          scaleY: 1,
          opacity: 0,
          transformOrigin: "center center",
        })
      }

      syncSize()
      resetGlowTransform()

      const effectiveLoop =
        Boolean(loopGlow) && !disabled && !showBadge

      const effectivePersistent =
        Boolean(persistentGlow) && !disabled && !showBadge && !effectiveLoop

      const applyLoopGlow = () => {
        const { bw, bh } = readSize()
        if (bw <= 1 || bh <= 1) return

        // Uniform scale keeps circular shells (logo) from stretching into blobs.
        const baseDim = Math.max(bw, bh)
        const baseScale = (baseDim + LOOP_GLOW_BASE_EDGE_PX) / baseDim
        const peakScale = (baseDim + LOOP_GLOW_PEAK_EDGE_PX) / baseDim

        gsap.killTweensOf(glow)
        gsap.set(glow, { transformOrigin: "center center" })
        gsap.fromTo(
          glow,
          {
            scaleX: baseScale,
            scaleY: baseScale,
            opacity: LOOP_GLOW_BASE_OPACITY,
          },
          {
            scaleX: peakScale,
            scaleY: peakScale,
            opacity: LOOP_GLOW_PEAK_OPACITY,
            duration: 2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          }
        )
      }

      const ro =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => {
              syncSize()
              if (effectiveLoop) {
                applyLoopGlow()
              } else {
                resetGlowTransform()
              }
            })
          : null
      ro?.observe(container)

      const handleMouseEnterPersistent = () => {
        if (showBadge || disabled) return
        const { bw, bh } = readSize()
        const scaleX = (bw + PERSIST_GLOW_HOVER_EDGE_PX) / bw
        const scaleY = (bh + PERSIST_GLOW_HOVER_EDGE_PX) / bh
        gsap.killTweensOf(glow)
        gsap.to(glow, {
          scaleX,
          scaleY,
          opacity: PERSIST_GLOW_HOVER_OPACITY,
          duration: 0.28,
          ease: "sine.out",
        })
      }

      const handleMouseLeavePersistent = () => {
        if (showBadge || disabled) return
        const { bw, bh } = readSize()
        const scaleX = (bw + PERSIST_GLOW_BASE_EDGE_PX) / bw
        const scaleY = (bh + PERSIST_GLOW_BASE_EDGE_PX) / bh
        gsap.killTweensOf(glow)
        gsap.to(glow, {
          scaleX,
          scaleY,
          opacity: PERSIST_GLOW_BASE_OPACITY,
          duration: 0.28,
          ease: "power2.out",
        })
      }

      const handleMouseEnterTransient = () => {
        if (showBadge || disabled) return

        const { bw, bh } = readSize()

        gsap.killTweensOf(glow)

        const scaleX = (bw + GLOW_EDGE_PX) / bw
        const scaleY = (bh + GLOW_EDGE_PX) / bh

        const tl = gsap.timeline()

        tl.to(glow, {
          scaleX: scaleX,
          scaleY: scaleY,
          duration: 0.3,
          opacity: 1,
          ease: "sine.inOut",
        }).to(glow, {
          scaleX: 1,
          scaleY: 1,
          opacity: 0,
          delay: 1,
          duration: 1,
          ease: "power2.out",
        })
      }

      const handleMouseLeaveTransient = () => {
        gsap.killTweensOf(glow)
        gsap.to(glow, {
          scaleX: 1,
          scaleY: 1,
          opacity: 0,
          duration: 0.2,
          ease: "power2.out",
        })
      }

      if (effectiveLoop) {
        applyLoopGlow()
      } else if (effectivePersistent) {
        gsap.killTweensOf(glow)
        const { bw, bh } = readSize()
        const baseScaleX = (bw + PERSIST_GLOW_BASE_EDGE_PX) / bw
        const baseScaleY = (bh + PERSIST_GLOW_BASE_EDGE_PX) / bh
        gsap.to(glow, {
          opacity: PERSIST_GLOW_BASE_OPACITY,
          scaleX: baseScaleX,
          scaleY: baseScaleY,
          duration: 0.4,
          ease: "sine.out",
        })
        container.addEventListener("mouseenter", handleMouseEnterPersistent)
        container.addEventListener("mouseleave", handleMouseLeavePersistent)
      } else {
        gsap.killTweensOf(glow)
        gsap.to(glow, {
          opacity: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.2,
          ease: "power2.out",
        })
        container.addEventListener("mouseenter", handleMouseEnterTransient)
        container.addEventListener("mouseleave", handleMouseLeaveTransient)
      }

      return () => {
        ro?.disconnect()
        gsap.killTweensOf(glow)
        container.removeEventListener("mouseenter", handleMouseEnterPersistent)
        container.removeEventListener("mouseleave", handleMouseLeavePersistent)
        container.removeEventListener("mouseenter", handleMouseEnterTransient)
        container.removeEventListener("mouseleave", handleMouseLeaveTransient)
      }
    },
    {
      scope: containerRef,
      dependencies: [showBadge, disabled, persistentGlow, loopGlow],
    }
  )

  return (
    <div
      ref={setContainerRef}
      className={cn(
        "group/glowing-button relative inline-flex w-fit isolate rounded-4xl",
        className
      )}
    >
      <div
        ref={glowRef}
        className='pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] opacity-0 will-change-[transform,opacity]'
      >
        <div
          className={cn(
            "rainbow-gradient animate-spin-slow absolute top-1/2 left-1/2 aspect-square w-full min-h-full -translate-x-1/2 -translate-y-1/2 rounded-full",
            "max-w-none"
          )}
        />
      </div>

      {asGlowShell ? (
        children
      ) : (
        <Button
          {...props}
          disabled={showBadge || disabled}
          className={cn(
            "relative z-10 rounded-[inherit] bg-clip-padding",
            buttonClassName
          )}
        >
          {children}
        </Button>
      )}

      {showBadge && (
        <div className='absolute -top-3 -right-1 h-5 flex items-center justify-center px-2 rounded-full bg-gray-700 z-20 pointer-events-none'>
          <span className='text-xs font-medium text-white'>Soon</span>
        </div>
      )}
    </div>
  )
})

GlowingButton.displayName = "GlowingButton"

export default GlowingButton
