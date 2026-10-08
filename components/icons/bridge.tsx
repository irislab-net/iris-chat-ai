import React from "react"

export const BridgeIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => (
  <svg
    ref={ref}
    viewBox='0 0 48 48'
    xmlns='http://www.w3.org/2000/svg'
    className='size-[1em]'
    fill='none'
    stroke='currentColor'
    strokeWidth='4'
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M8 13C8 13 14 23 24 23C34 23 40 13 40 13' />
    <path d='M8 10V38' />
    <path d='M40 10V38' />
    <path d='M4 30.5C4 30.5 16.1877 29.9026 24 30C31.8196 30.0975 44 31 44 31' />
    <path d='M16 21V30' />
    <path d='M24 23L24 30' />
    <path d='M32 21L32 30' />
    <path d='M8 13L4 18' />
    <path d='M44 18L40 13' />
  </svg>
))
