import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedCrystalBall = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const ballRef = useRef<SVGGElement>(null)
    const baseRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.set(ballRef.current, {
        transformOrigin: "center",
      })
        .to(baseRef.current, {
          y: 1,
          duration: 0.1,
        })
        .to(
          ballRef.current,
          {
            y: -1,
            duration: 0.1,
          },
          "<"
        )
        .to(ballRef.current, {
          rotate: 360,
          duration: 0.5,
          ease: "back.inOut",
        })
        .to(ballRef.current, {
          y: 0,
          duration: 0.1,
        })
        .to(
          baseRef.current,
          {
            y: 0,
            duration: 0.1,
          },
          "<"
        )
    })

    return (
      <svg
        ref={containerRef}
        viewBox='0 0 24 24'
        fill='none'
        className='size-[1em]'
        xmlns='http://www.w3.org/2000/svg'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        {...props}
      >
        <g ref={ballRef}>
          <circle cx='12' cy='10' r='8' strokeWidth='2' />
          <path
            d='M7.04078 9.36271C7.17109 8.34864 7.60915 7.3989 8.29591 6.64148C8.98266 5.88406 9.88511 5.35537 10.8816 5.12668L10.8827 5.13156C9.88722 5.36002 8.98568 5.88817 8.29961 6.64483C7.61354 7.4015 7.17592 8.35029 7.04574 9.36335L7.04078 9.36271Z'
            strokeWidth='1.5'
          />
        </g>

        <path
          ref={baseRef}
          d='M17.7478 20.2119C15.9399 21.0687 13.9495 21.5097 11.934 21.4998C9.91839 21.49 7.93281 21.0296 6.13407 20.1551L6.14128 20.1414C7.93781 21.0149 9.92095 21.4746 11.934 21.4845C13.9471 21.4943 15.935 21.0539 17.7407 20.1981L17.7478 20.2119Z'
          strokeWidth='3'
        />
      </svg>
    )
  }
)
