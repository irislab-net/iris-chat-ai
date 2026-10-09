import React from "react"

export const DeFiIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => (
  <svg
    ref={ref}
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
    className='size-[1em]'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M22 6L12 1L2 6V18L12 23L22 18V6Z' strokeWidth='2' />
    <path d='M18 8.18182L12 5L6 8.18182V15.8182L12 19L18 15.8182V8.18182Z' />
    <circle cx='12' cy='12' r='2' strokeWidth='1.5' />
    <path d='M22 6L13.5 10.5M22 18L13.5 13M12 23V14M2 18L10 13M2 6L10.5 10.5M12 1V10' />
  </svg>
))
