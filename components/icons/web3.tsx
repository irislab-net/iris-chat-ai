import React from "react"

export const Web3Icon = React.forwardRef<
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
      <circle cx='84' cy='36' r='6' />
      <circle cx='84' cy='72' r='6' />
      <circle cx='54' cy='90' r='6' />
      <circle cx='54' cy='18' r='6' />
      <circle cx='24' cy='36' r='6' />
      <circle cx='24' cy='72' r='6' />
    </g>

    <g
      stroke='currentColor'
      strokeWidth='4'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <line x1='54' y1='54' x2='54' y2='18' />
      <line x1='54.029' y1='53.715' x2='24.029' y2='71.715' />
      <line x1='54.029' y1='54.285' x2='84.029' y2='72.285' />
      <path d='M54.5 89.5L84 72V36L54 18L24 36V72L53.5 89.5' />
    </g>
  </svg>
))
