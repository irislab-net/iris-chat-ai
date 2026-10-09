import React from "react"

export const SecurityIcon = React.forwardRef<
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
      <circle cx='54' cy='23' r='6' />
      <circle cx='54' cy='85' r='6' />
      <circle cx='54' cy='54' r='9' />
    </g>

    <g stroke='currentColor' strokeWidth='4'>
      <path d='M85 36.95L85 54L85 71.05C85 78.8 78.8 85 71.05 85H36.95C29.2 85 23.0001 78.8 23 71.05V36.95C23 29.2 29.2 22.9998 36.95 23H71.05C78.8 23 85 29.2 85 36.95Z' />
      <path d='M80.5 27L27 80.5' />
    </g>
  </svg>
))
