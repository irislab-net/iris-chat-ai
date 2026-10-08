import React from "react"

export const SwapIcon = React.forwardRef<
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
      <circle cx='48' cy='84' r='6' />
      <circle cx='20' cy='43' r='6' />
      <circle cx='60' cy='24' r='6' />
      <circle cx='88' cy='65' r='6' />
      <circle cx='81' cy='41' r='9' />
      <circle cx='23' cy='63' r='9' />
    </g>

    <g stroke='currentColor' strokeWidth='4'>
      <line x1='82.1822' y1='43.245' x2='60.245' y2='24.8178' />
      <line x1='26.8168' y1='65.7439' x2='47.7439' y2='83.1832' />
      <line x1='82' y1='43' x2='22' y2='43' />
      <line x1='26' y1='65' x2='86' y2='65' />
    </g>
  </svg>
))
