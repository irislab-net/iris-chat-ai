import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React from "react"

export const AnimatedBlend = React.forwardRef<AnimationHandle>((props, ref) => {
  const { containerRef } = useIconAnimation(ref, tl => {
    gsap.set("circle", {
      transformOrigin: "center",
    })

    tl.to("circle:first-child", {
      attr: {
        cx: 15,
        cy: 15,
      },
      duration: 0.5,
      ease: "back.out",
    })
      .to(
        "circle:last-child",
        {
          attr: {
            cx: 9,
            cy: 9,
          },
          duration: 0.5,
          ease: "back.out",
        },
        "<"
      )
      .to("circle:first-child", {
        attr: {
          cx: 9,
          cy: 9,
        },
        duration: 0.5,
        delay: 0.3,
        ease: "back.out",
      })
      .to(
        "circle:last-child",
        {
          attr: {
            cx: 15,
            cy: 15,
          },
          duration: 0.5,
          ease: "back.out",
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
      overflow='visible'
      {...props}
    >
      <circle cx='9' cy='9' r='7' />
      <circle cx='15' cy='15' r='7' />
    </svg>
  )
})
