import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedStar = React.forwardRef<AnimationHandle>((props, ref) => {
  const starRef = useRef<SVGGElement>(null)
  const shineRef = useRef<SVGPathElement>(null)

  const { containerRef } = useIconAnimation(ref, tl => {
    gsap.set(starRef.current, {
      transformOrigin: "center",
    })

    gsap.set(shineRef.current, {
      drawSVG: "0% 5%",
      opacity: 0,
    })

    tl.set(shineRef.current, {
      opacity: 0.5,
    })
      .to(starRef.current, {
        rotate: 70,
        duration: 1,
        ease: "back.inOut",
      })
      .to(
        shineRef.current,
        {
          drawSVG: "95% 100%",
          duration: 1,
          ease: "none",
        },
        "<"
      )
      .to(
        shineRef.current,
        {
          opacity: 0,
          duration: 0.3,
        },
        "-=0.1"
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
      overflow='visible'
      {...props}
    >
      <g ref={starRef}>
        <path d='M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z' />

        <path
          ref={shineRef}
          className='opacity-0 text-background mix-blend-lighten'
          d='M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z'
          strokeWidth='4'
        />
      </g>
    </svg>
  )
})
