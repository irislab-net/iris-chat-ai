import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import React, { useRef } from "react"

export const AnimatedFuel = React.forwardRef<AnimationHandle>((props, ref) => {
  const pathRef = useRef<SVGPathElement>(null)

  const { containerRef } = useIconAnimation(ref, tl => {
    tl.to(pathRef.current, {
      morphSVG: {
        shape:
          "M14 13.0001H14.5C15.0304 13.0001 15.5391 13.2108 15.9142 13.5859C16.2893 13.961 16.5 14.4697 16.5 15.0001V17.0001C16.5 17.5305 16.7107 18.0393 17.0858 18.4143C17.4609 18.7894 18.0554 18.9999 18.5858 18.9999C19.1162 18.9999 19.6249 18.7892 20 18.4141C20.3751 18.0391 20.5858 17.5304 20.5858 16.9999L19.5 12.5C19.5002 12.2361 19.2488 11.8941 19.1758 11.7185C19.1028 11.5428 18.773 11.3061 18.5858 11.1201L15.9142 9.5",
      },
      duration: 0.4,
      ease: "back.inOut",
    }).to(pathRef.current, {
      morphSVG: {
        shape:
          "M14 13H16C16.5304 13 17.0391 13.2107 17.4142 13.5858C17.7893 13.9609 18 14.4696 18 15V17C18 17.5304 18.2107 18.0391 18.5858 18.4142C18.9609 18.7893 19.4696 19 20 19C20.5304 19 21.0391 18.7893 21.4142 18.4142C21.7893 18.0391 22 17.5304 22 17V9.83C22.0002 9.56609 21.9482 9.30474 21.8469 9.06103C21.7457 8.81732 21.5972 8.59606 21.41 8.41L18 5",
      },
      duration: 0.4,
      ease: "back.out(4)",
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
      <path d='M3 22H15' />
      <path d='M4 9H14' />
      <path d='M14 22V4C14 3.46957 13.7893 2.96086 13.4142 2.58579C13.0391 2.21071 12.5304 2 12 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V22' />
      <path
        ref={pathRef}
        d='M14 13H16C16.5304 13 17.0391 13.2107 17.4142 13.5858C17.7893 13.9609 18 14.4696 18 15V17C18 17.5304 18.2107 18.0391 18.5858 18.4142C18.9609 18.7893 19.4696 19 20 19C20.5304 19 21.0391 18.7893 21.4142 18.4142C21.7893 18.0391 22 17.5304 22 17V9.83C22.0002 9.56609 21.9482 9.30474 21.8469 9.06103C21.7457 8.81732 21.5972 8.59606 21.41 8.41L18 5'
      />
    </svg>
  )
})
