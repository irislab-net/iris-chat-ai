import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedAward = React.forwardRef<AnimationHandle>((props, ref) => {
  const pathRef = useRef<SVGGElement>(null)

  const { containerRef } = useIconAnimation(ref, tl => {
    gsap.set(pathRef.current, {
      transformOrigin: "top",
    })

    tl.to(pathRef.current, {
      rotate: 20,
      duration: 0.3,
      ease: "back.out",
    })
      .to(pathRef.current, {
        rotate: -15,
        duration: 0.4,
        ease: "back.out",
      })
      .to(pathRef.current, {
        rotate: 10,
        duration: 0.3,
        ease: "back.out",
      })
      .to(pathRef.current, {
        rotate: -5,
        duration: 0.4,
        ease: "back.out",
      })
      .to(pathRef.current, {
        rotate: 0,
        duration: 0.2,
        ease: "back.out",
      })
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
      <g ref={pathRef}>
        <path d='m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526' />
        <circle cx='12' cy='8' r='6' />
      </g>
    </svg>
  )
})
