import React from "react"

export const SupplyIcon = React.forwardRef<
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
      <circle cx='36' cy='39' r='6' />
      <circle cx='77' cy='51' r='6' />
      <circle cx='42' cy='74' r='6' />
    </g>

    <g stroke='currentColor' strokeWidth='4'>
      <circle cx='54' cy='54' r='24' className='scale-on-toggle' />
      <circle cx='54' cy='54' r='39' className='scale-on-toggle' />
    </g>
  </svg>
))
