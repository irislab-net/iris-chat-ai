import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedWallet = React.forwardRef<AnimationHandle>(
  (props, ref) => {
    const buttonRef = useRef<SVGPathElement>(null)

    const { containerRef } = useIconAnimation(ref, tl => {
      gsap.set(buttonRef.current, {
        transformOrigin: "right",
      })

      gsap.set("g", {
        transformOrigin: "bottom left",
      })

      gsap.set("g line", {
        transformOrigin: "top",
      })

      tl.to(buttonRef.current, {
        scaleX: 0,
        rotateY: 90,
        duration: 0.5,
        ease: "power2.out",
      })
        .to("g", {
          rotate: -15,
          duration: 0.3,
          ease: "back.out",
        })
        .to(
          "g line",
          {
            scaleY: 1.9,
            duration: 0.3,
            ease: "back.out",
          },
          "<"
        )
        .to("g", {
          rotate: 0,
          duration: 0.3,
          delay: 0.3,
          ease: "back.in",
        })
        .to(
          "g line",
          {
            scaleY: 1,
            duration: 0.3,
            ease: "power2.in",
          },
          "<"
        )
        .to(buttonRef.current, {
          scaleX: 1,
          rotateY: 0,
          duration: 0.3,
          ease: "back.in",
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
        <path d='M3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H20C20.2652 21 20.5196 20.8946 20.7071 20.7071C20.8946 20.5196 21 20.2652 21 20V16' />
        <path d='M3 5C3 5.53043 3.21071 6.03914 3.58579 6.41421C3.96086 6.78929 4.46957 7 5 7H20C20.2652 7 20.5196 7.10536 20.7071 7.29289C20.8946 7.48043 21 7.73478 21 8V16' />

        <path
          ref={buttonRef}
          d='M18 12H21C21.2652 12 21.5196 12.1054 21.7071 12.2929C21.8946 12.4804 22 12.7348 22 13V15C22 15.2652 21.8946 15.5196 21.7071 15.7071C21.5196 15.8946 21.2652 16 21 16H18C17.4696 16 16.9609 15.7893 16.5858 15.4142C16.2107 15.0391 16 14.5304 16 14C16 13.4696 16.2107 12.9609 16.5858 12.5858C16.9609 12.2107 17.4696 12 18 12Z'
        />

        <g>
          <line x1='19' y1='4' x2='19' y2='7' />
          <path d='M19 4C19 3.73478 18.8946 3.48043 18.7071 3.29289C18.5196 3.10536 18.2652 3 18 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5' />
        </g>
      </svg>
    )
  }
)
