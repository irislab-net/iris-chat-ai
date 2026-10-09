import useIconAnimation from "@/hooks/useIconAnimation"
import type { AnimationHandle } from "@/types/animation"
import gsap from "gsap"
import React, { useRef } from "react"

export const AnimatedCoins = React.forwardRef<AnimationHandle>((props, ref) => {
  const firstCoinRef = useRef<SVGGElement>(null)
  const firstCoinEdgeRef = useRef<SVGPathElement>(null)
  const secondCoinRef = useRef<SVGGElement>(null)
  const secondCoinEdgeRef = useRef<SVGPathElement>(null)
  const thirdCoinRef = useRef<SVGGElement>(null)

  const { containerRef } = useIconAnimation(ref, tl => {
    gsap.set(thirdCoinRef.current, {
      transformOrigin: "center",
      opacity: 0,
      y: -6,
    })

    tl.to(firstCoinRef.current, {
      rotate: 20,
      x: 4,
      y: 4,
      opacity: 0,
      duration: 0.4,
      ease: "back.out",
    })
      .to(
        secondCoinRef.current,
        {
          rotate: 10,
          y: 16,
          x: 2,
          duration: 0.1,
          ease: "none",
        },
        "-=0.1"
      )
      .to(secondCoinRef.current, {
        rotate: 45,
        x: 14,
        y: 5,
        duration: 0.2,
        ease: "back.out(1)",
      })
      .to(thirdCoinRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: "back.out",
      })
      .to(
        secondCoinEdgeRef.current,
        {
          strokeWidth: 0,
          opacity: 0,
          duration: 0.3,
          ease: "none",
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
      overflow='visible'
      {...props}
    >
      <g ref={firstCoinRef}>
        <path
          ref={firstCoinEdgeRef}
          d='M11.4583 19.9208C10.799 19.1571 10.3429 18.2395 10.1323 17.2529C9.92159 16.2663 9.9631 15.2425 10.253 14.2761C10.5428 13.3098 11.0717 12.4322 11.7906 11.7244C12.5095 11.0166 13.3953 10.5015 14.366 10.2267C15.3368 9.95201 16.3611 9.92648 17.3443 10.1525C18.3275 10.3786 19.2379 10.8489 19.9912 11.52'
          className='opacity-0'
        />
        <path d='M18.09 10.37C19.0353 10.7224 19.8765 11.3075 20.5357 12.0712C21.195 12.8349 21.6511 13.7524 21.8617 14.7391C22.0724 15.7257 22.0309 16.7495 21.741 17.7158C21.4512 18.6822 20.9223 19.5598 20.2034 20.2676C19.4845 20.9754 18.5987 21.4905 17.628 21.7652C16.6572 22.04 15.6329 22.0655 14.6497 21.8395C13.6665 21.6134 12.7561 21.1431 12.0028 20.472C11.2495 19.8009 10.6776 18.9507 10.34 18' />
        <path d='M16.71 13.88L17.41 14.59L14.59 17.41' />
      </g>

      <g ref={secondCoinRef}>
        <path
          ref={secondCoinEdgeRef}
          d='M7.56287 13.9806C6.55671 13.9068 5.5854 13.5805 4.73878 13.0318C3.89217 12.4831 3.19757 11.7298 2.71923 10.8416C2.24089 9.95329 1.99425 8.95876 2.00212 7.94992C2.00999 6.94108 2.27212 5.95052 2.76426 5.06983C3.2564 4.18914 3.96267 3.44677 4.81775 2.91137C5.67283 2.37596 6.6491 2.06482 7.6563 2.0067'
        />
        <path d='M5.49882 2.53787C6.41645 2.11864 7.42499 1.93756 8.43115 2.01139C9.43731 2.08522 10.4086 2.41156 11.2552 2.96024C12.1019 3.50892 12.7965 4.26222 13.2748 5.15048C13.7531 6.03874 13.9998 7.03328 13.9919 8.04212C13.984 9.05095 13.7219 10.0415 13.2298 10.9222C12.7376 11.8029 12.0314 12.5453 11.1763 13.0807C10.3212 13.6161 9.34492 13.9272 8.33773 13.9853C7.33053 14.0435 6.32495 13.8467 5.41396 13.4132' />
        <path d='M7.00496 5.99562L8.00198 6.00269V9.99078' />
      </g>

      <g ref={thirdCoinRef}>
        <path d='M7.56287 13.9806C6.55671 13.9068 5.5854 13.5805 4.73878 13.0318C3.89217 12.4831 3.19757 11.7298 2.71923 10.8416C2.24089 9.95329 1.99425 8.95876 2.00212 7.94992C2.00999 6.94108 2.27212 5.95052 2.76426 5.06983C3.2564 4.18914 3.96267 3.44677 4.81775 2.91137C5.67283 2.37596 6.6491 2.06482 7.6563 2.0067' />
        <path d='M5.49882 2.53787C6.41645 2.11864 7.42499 1.93756 8.43115 2.01139C9.43731 2.08522 10.4086 2.41156 11.2552 2.96024C12.1019 3.50892 12.7965 4.26222 13.2748 5.15048C13.7531 6.03874 13.9998 7.03328 13.9919 8.04212C13.984 9.05095 13.7219 10.0415 13.2298 10.9222C12.7376 11.8029 12.0314 12.5453 11.1763 13.0807C10.3212 13.6161 9.34492 13.9272 8.33773 13.9853C7.33053 14.0435 6.32495 13.8467 5.41396 13.4132' />
        <path d='M7.00496 5.99562L8.00198 6.00269V9.99078' />
      </g>
    </svg>
  )
})
