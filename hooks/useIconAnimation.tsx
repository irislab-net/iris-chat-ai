import type { AnimationHandle } from "@/types/animation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useImperativeHandle, useRef, useState } from "react"

function useIconAnimation<T = SVGSVGElement>(
  ref: React.ForwardedRef<AnimationHandle>,
  animationHandler?: (timeline: GSAPTimeline) => void,
  timelineOptions?: gsap.TimelineVars,
  {
    onStart,
    onComplete,
    autoplay = false,
  }: {
    onStart?: () => void
    onComplete?: () => void
    /** Start timeline once built (avoids parent play() racing before useGSAP). */
    autoplay?: boolean
  } = {}
) {
  const containerRef = useRef<T>(null)
  const timeline = useRef<GSAPTimeline>(null)

  const [isPlaying, setIsPlaying] = useState(false)

  const handle: AnimationHandle = {
    play: () => {
      timeline.current?.restart()
    },
    restart: () => timeline.current?.restart(),
    reverse: () => timeline.current?.reverse(),
    pause: () => timeline.current?.pause(),
    resume: () => timeline.current?.resume(),
    kill: () => timeline.current?.kill(),
  }

  useImperativeHandle(ref, () => handle)

  useGSAP(
    () => {
      const root = containerRef.current
      if (!root) return

      timeline.current = gsap.timeline({
        ...timelineOptions,
        scope: root,
        paused: true,
        onStart: () => {
          setIsPlaying(true)
          onStart?.()
        },
        onComplete: () => {
          setIsPlaying(false)
          onComplete?.()
        },
      })

      animationHandler?.(timeline.current)

      if (autoplay && timeline.current) {
        timeline.current.play(0)
      }

      return () => {
        timeline.current?.kill()
      }
    },
    { scope: containerRef }
  )

  return {
    containerRef,
    handle,
    isPlaying,
  }
}

export default useIconAnimation
