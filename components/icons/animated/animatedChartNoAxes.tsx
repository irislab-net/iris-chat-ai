import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedChartNoAxes = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const chartRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      tl.set("g path", {
        transformOrigin: "bottom",
      })
        .to(chartRef.current, {
          drawSVG: "0% 0%",
          duration: 0.2,
        })
        .to(
          "g path",
          {
            scaleY: 0.5,
            stagger: 0.1,
            duration: 0.3,
            ease: "sine.inOut",
          },
          "<"
        )
        .to(chartRef.current, {
          drawSVG: "100% 100%",
          duration: 0,
        })
        .to(chartRef.current, {
          drawSVG: "0% 100%",
          duration: 0.2,
        })
        .to(
          "g path",
          {
            scaleY: 1,
            stagger: 0.1,
            duration: 0.3,
            ease: "sine.inOut",
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
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        {...props}
      >
        <g>
          <path d='M4 18v3' />
          <path d='M8 14v7' />
          <path d='M12 16v5' />
          <path d='M16 14v7' />
          <path d='M20 10v11' />
        </g>

        <path
          ref={chartRef}
          d='m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15'
        />
      </svg>
    )
  }
)
