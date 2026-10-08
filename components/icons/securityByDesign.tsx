import React from "react"

export const SecurityByDesignIcon = React.forwardRef<
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
      <circle cx='26' cy='27' r='6' />
      <circle cx='82' cy='82' r='6' />
      <circle cx='82' cy='27' r='6' />
      <circle cx='26' cy='82' r='6' />
    </g>
    <g stroke='currentColor' strokeWidth='4'>
      <circle cx='54' cy='54' r='24' className='scale-on-toggle' />
      <circle cx='54' cy='54' r='39' className='scale-on-toggle' />
    </g>
  </svg>
))
