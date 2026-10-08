import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React from "react"

export const AnimatedZap = React.forwardRef<AnimationHandle>((props, ref) => {
  const { containerRef } = useIconAnimation(ref, tl => {
    gsap.set("path", {
      transformOrigin: "center",
    })

    tl.to("path", {
      y: -2,
      x: 2,
      skewX: 35,
      rotate: 60,
      scale: 0.6,
      duration: 0.2,
      ease: "back.in",
    })
      .to("path", {
        y: 2,
        x: -2,
        scaleX: 0.9,
        scaleY: 1,
        duration: 0.2,
        ease: "back.inOut",
      })
      .to("path", {
        y: -2,
        x: 2,
        skewX: 10,
        rotate: 20,
        scale: 1,
        duration: 0.2,
        ease: "back.inOut",
      })
      .to("path", {
        y: 0,
        x: 0,
        skewX: 0,
        rotate: 0,
        scale: 1,
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
      overflow='visible'
      {...props}
    >
      <path d='M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z' />
    </svg>
  )
})
