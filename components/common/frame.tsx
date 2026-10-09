"use client"
import { cn } from "@/lib/utils"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import React, { useCallback, useRef } from "react"

type FrameProps = React.PropsWithChildren<
  React.ComponentPropsWithoutRef<"div"> & {
    /**
     * Faint grid lines with a center-out radial fade and soft shine pulse.
     * Line color: pass `gridLineClassName` using `text-*` (uses `currentColor`).
     */
    animatedGridBackground?: boolean
    gridLineClassName?: string
    /** Brighter grid lines under the cursor spotlight; defaults to `gridLineClassName`. */
    gridLineSpotClassName?: string
  }
>

const Frame = React.forwardRef<HTMLDivElement, FrameProps>(
  (
    {
      className,
      children,
      animatedGridBackground = false,
      gridLineClassName,
      gridLineSpotClassName,
      onPointerEnter,
      onPointerLeave,
      onPointerMove,
      ...props
    },
    ref
  ) => {
  const frameRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline>(null)

  const setGridSpot = useCallback((clientX: number, clientY: number) => {
    const el = frameRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    el.style.setProperty("--frame-grid-spot-x", `${x}%`)
    el.style.setProperty("--frame-grid-spot-y", `${y}%`)
  }, [])

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (animatedGridBackground) {
        setGridSpot(event.clientX, event.clientY)
      }
      onPointerMove?.(event)
    },
    [animatedGridBackground, onPointerMove, setGridSpot]
  )

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (animatedGridBackground) {
        frameRef.current?.style.setProperty("--frame-grid-spot-active", "1")
        setGridSpot(event.clientX, event.clientY)
      }
      onPointerEnter?.(event)
    },
    [animatedGridBackground, onPointerEnter, setGridSpot]
  )

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (animatedGridBackground) {
        frameRef.current?.style.setProperty("--frame-grid-spot-active", "0")
      }
      onPointerLeave?.(event)
    },
    [animatedGridBackground, onPointerLeave]
  )

  const setRefs = (element: HTMLDivElement | null) => {
    frameRef.current = element
    if (typeof ref === "function") {
      ref(element)
    } else if (ref) {
      ref.current = element
    }
  }

  useGSAP(
    () => {
      if (!frameRef.current) return

      // Kill any existing timeline to prevent conflicts
      timelineRef.current?.kill()

      // Set initial state to ensure element starts invisible
      gsap.set(frameRef.current, {
        opacity: 0,
        y: 24,
      })

      timelineRef.current = gsap.timeline({
        scrollTrigger: {
          trigger: frameRef.current,
          start: "top 100%",
          end: "top 85%",
          scrub: 1,
          refreshPriority: -1, // Lower priority to ensure proper refresh
        },
      })

      timelineRef.current.fromTo(
        frameRef.current,
        {
          opacity: 0,
          y: 24,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "none",
        }
      )

      // Return cleanup function
      return () => {
        timelineRef.current?.kill()
      }
    },
    { scope: frameRef }
  )

  return (
    <div
      ref={setRefs}
      className={cn(
        "group/frame relative cursor-default rounded-xl",
        animatedGridBackground && "frame-grid-interactive overflow-hidden",
        className
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      {...props}
    >
      {animatedGridBackground ? (
        <>
          <div className='frame-grid-glow' aria-hidden>
            <div className={cn("frame-grid-glow__lines", gridLineClassName)} />
            <div
              className={cn(
                "frame-grid-glow__lines-spot",
                gridLineSpotClassName ?? gridLineClassName
              )}
            />
            <div className='frame-grid-glow__halo' />
          </div>
          <div className='relative z-10 flex size-full flex-col items-center justify-center'>
            {children}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  )
  }
)

export default Frame
