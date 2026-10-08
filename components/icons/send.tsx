import React from "react"

export const SendIcon = React.forwardRef<
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
      <circle cx='60' cy='30' r='6' />
      <circle cx='82' cy='54' r='6' />
      <circle cx='60' cy='78' r='6' />
      <circle cx='21' cy='54' r='9' />
    </g>

    <g stroke='currentColor' strokeWidth='4' strokeLinecap='round'>
      <line x1='82.1177' y1='54.826' x2='61.826' y2='76.8823' />
      <line x1='83.1716' y1='54' x2='61' y2='31.8284' />
      <line x1='20' y1='54' x2='83' y2='54' />
    </g>
  </svg>
))
