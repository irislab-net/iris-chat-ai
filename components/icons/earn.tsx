import React from "react"

export const EarnIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => (
  <svg
    ref={ref}
    viewBox='0 0 108 108'
    xmlns='http://www.w3.org/2000/svg'
    className='size-[1em]'
    fill='none'
    {...props}
  >
    <g fill='currentColor'>
      <circle cx='54' cy='54' r='9' />
      <circle cx='90' cy='54' r='6' />
      <circle cx='54' cy='90' r='6' />
      <circle cx='54' cy='18' r='6' />
      <circle cx='18' cy='54' r='6' />
    </g>

    <g stroke='currentColor' strokeWidth='4'>
      <path d='M18 54H90' />
      <path d='M54 18V90' />
    </g>
  </svg>
))
