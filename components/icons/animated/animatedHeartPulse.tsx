import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedHeartPulse = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const heartRef = useRef<SVGGElement>(null)
    const pulseRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set(heartRef.current, {
        transformOrigin: "center",
      })

      gsap.set(pulseRef.current, {
        transformOrigin: "center",
      })

      const heartTimeline = gsap.timeline()
      heartTimeline
        .to(heartRef.current, {
          scale: 1.2,
          duration: 0.2,
          ease: "power2.inOut",
        })
        .to(heartRef.current, {
          scale: 1,
          duration: 0.1,
          ease: "power2.inOut",
        })
        .to(heartRef.current, {
          scale: 1.2,
          duration: 0.2,
          ease: "power2.inOut",
        })
        .to(heartRef.current, {
          scale: 1,
          duration: 0.2,
          ease: "power2.inOut",
        })

      const pulseTimeline = gsap.timeline()
      pulseTimeline
        .to(pulseRef.current, {
          drawSVG: "100% 100%",
          duration: 0.3,
          ease: "power2.inOut",
        })
        .set(pulseRef.current, {
          drawSVG: "0% 0%",
        })
        .to(pulseRef.current, {
          drawSVG: "0% 100%",
          duration: 0.3,
          ease: "power2.inOut",
        })

      tl.add(heartTimeline)
      tl.add(pulseTimeline, "<")
    })

    return (
      <svg
        ref={containerRef}
        viewBox='0 0 24 24'
        fill='none'
        className='size-[1em]'
        xmlns='http://www.w3.org/2000/svg'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        overflow='visible'
        {...props}
      >
        <g ref={heartRef}>
          <path d='M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5' />
          <path ref={pulseRef} d='M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27' />
        </g>
      </svg>
    )
  }
)
