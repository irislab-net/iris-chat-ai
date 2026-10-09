import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedLandmark = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const roofRef = useRef<SVGPathElement>(null)
    const pillarsRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set(pillarsRef.current, {
        transformOrigin: "bottom",
      })

      tl.to(roofRef.current, {
        y: 3,
        ease: "back.out",
        duration: 0.2,
      })
        .to(
          pillarsRef.current,
          {
            scaleY: 0.8,
            ease: "back.out",
            duration: 0.2,
          },
          "<"
        )
        .to(roofRef.current, {
          y: 0,
          ease: "back.out",
          duration: 0.2,
        })
        .to(pillarsRef.current, {
          scaleY: 1,
          ease: "ease.inOut",
          duration: 0.2,
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
        {...props}
      >
        <path d='M3 21.0002H21' />

        <path
          ref={pillarsRef}
          d='M6 18.0002V10.0002M10 18.0002V10.0002M14 18.0002V10.0002M18 18.0002V10.0002'
        />

        <path
          ref={roofRef}
          d='M12.424 2.26522L20 7.00022H4L11.576 2.26522C11.7298 2.16908 11.8067 2.12102 11.8892 2.10227C11.9621 2.0857 12.0379 2.0857 12.1108 2.10227C12.1933 2.12102 12.2702 2.16908 12.424 2.26522Z'
        />
      </svg>
    )
  }
)
