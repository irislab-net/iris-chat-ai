import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedRocket = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const fireRef = useRef<SVGPathElement>(null)
    const bodyRef = useRef<SVGGElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set(fireRef.current, {
        transformOrigin: "top right",
      })

      gsap.set(bodyRef.current, {
        transformOrigin: "bottom left",
      })

      const fireTimeline = gsap.timeline()
      fireTimeline
        .to(fireRef.current, {
          rotate: 12,
          duration: 0.1,
        })
        .to(
          fireRef.current,
          {
            scale: 1.2,
            duration: 0.4,
          },
          "<"
        )
        .to(fireRef.current, {
          rotate: -10,
          duration: 0.1,
        })
        .to(fireRef.current, {
          rotate: 8,
          duration: 0.1,
        })
        .to(
          fireRef.current,
          {
            scale: 0.8,
            duration: 0.1,
          },
          "<"
        )
        .to(fireRef.current, {
          rotate: -8,
          duration: 0.1,
        })
        .to(fireRef.current, {
          rotate: 6,
          duration: 0.1,
        })
        .to(fireRef.current, {
          rotate: -4,
          duration: 0.1,
        })
        .to(
          fireRef.current,
          {
            scale: 1,
            duration: 0.1,
          },
          "<"
        )
        .to(fireRef.current, {
          rotate: 0,
          duration: 0.1,
        })

      const bodyTimeline = gsap.timeline()
      bodyTimeline
        .to(bodyRef.current, {
          rotate: 6,
          duration: 0.1,
        })
        .to(bodyRef.current, {
          rotate: -6,
          duration: 0.4,
        })
        .to(bodyRef.current, {
          rotate: 0,
          duration: 0.3,
        })

      tl.add(fireTimeline).add(bodyTimeline, "<")
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
        <path
          ref={fireRef}
          d='M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z'
        />

        <g ref={bodyRef}>
          <path d='m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z' />
          <path d='M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0' />
          <path d='M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' />
        </g>
      </svg>
    )
  }
)
