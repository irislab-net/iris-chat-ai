import React from "react"

export const ReceiveIcon = React.forwardRef<
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
      <circle cx='48' cy='30' r='6' />
      <circle cx='26' cy='54' r='6' />
      <circle cx='48' cy='78' r='6' />
      <circle cx='87' cy='54' r='9' />
    </g>

    <g stroke='currentColor' strokeWidth='4'>
      <line x1='25.8284' y1='56' x2='47' y2='77.1716' />
      <line x1='25.8272' y1='54.1769' x2='46.1769' y2='31.1728' />
      <line x1='25' y1='54' x2='88' y2='54' />
    </g>
  </svg>
))
