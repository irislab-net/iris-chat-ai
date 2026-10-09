import React from "react"

export const BugBountyIcon = React.forwardRef<
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
      <circle cx='54' cy='54' r='12' />
    </g>

    <g stroke='currentColor' strokeWidth='4' strokeLinecap='round'>
      <circle cx='54' cy='54' r='28' className='scale-on-toggle' />
      <line x2='14' y2='54' x1='34' y1='54' />
      <line x2='94' y2='54' x1='74' y1='54' />
      <path d='M54 14V94' />
    </g>
  </svg>
))
