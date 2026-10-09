import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedGlobe = React.forwardRef<AnimationHandle>((props, ref) => {
  const curve1Ref = useRef<SVGPathElement>(null)
  const curve2Ref = useRef<SVGPathElement>(null)
  const curve3Ref = useRef<SVGPathElement>(null)

  const { containerRef } = useIconAnimation(
    ref,
    tl => {
      tl.to(curve1Ref.current, {
        morphSVG: {
          shape:
            "M12 2C9.43223 4.69615 8 8.27674 8 12C8 15.7233 9.43223 19.3038 12 22",
        },
        duration: 0.4,
        ease: "none",
      })
        .to(
          curve2Ref.current,
          {
            morphSVG: {
              shape:
                "M12 2C14.5678 4.69615 16 8.27674 16 12C16 15.7233 14.5678 19.3038 12 22",
            },
            duration: 0.4,
            ease: "none",
          },
          "<"
        )
        .to(
          curve3Ref.current,
          {
            morphSVG: {
              shape:
                "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2",
            },
            duration: 0.4,
            ease: "none",
          },
          "<"
        )
    },
    { repeat: 1 }
  )

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
      <path d='M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2' />

      <path
        ref={curve1Ref}
        d='M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2'
      />
      <path
        ref={curve2Ref}
        d='M12 2C9.43223 4.69615 8 8.27674 8 12C8 15.7233 9.43223 19.3038 12 22'
      />
      <path
        ref={curve3Ref}
        d='M12 2C14.5678 4.69615 16 8.27674 16 12C16 15.7233 14.5678 19.3038 12 22'
      />

      <path d='M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2' />
      <path d='M2 12H22' />
    </svg>
  )
})
