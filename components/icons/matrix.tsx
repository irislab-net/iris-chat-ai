import React from "react"

export const MatrixIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => (
  <svg
    ref={ref}
    className='size-[1em]'
    viewBox='0 0 108 108'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M82 79V28.5L54 54L26 28.5V79'
      stroke='currentColor'
      strokeWidth='4'
      strokeLinecap='round'
      strokeLinejoin='round'
    />

    <g fill='currentColor'>
      <circle cx='54' cy='55' r='9' />
      <circle cx='54' cy='80' r='9' />
      <circle cx='82' cy='55' r='9' />
      <circle cx='26' cy='55' r='9' />
      <circle cx='54' cy='29' r='9' />
      <circle cx='26' cy='29' r='6' />
      <circle cx='26' cy='81' r='6' />
      <circle cx='82' cy='29' r='6' />
      <circle cx='82' cy='81' r='6' />
    </g>
  </svg>
))
