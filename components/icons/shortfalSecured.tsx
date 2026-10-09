import React from "react"

export const ShortfalSecuredIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => (
  <svg
    ref={ref}
    viewBox='0 0 108 109'
    xmlns='http://www.w3.org/2000/svg'
    className='size-[1em]'
    fill='none'
    {...props}
  >
    <g fill='currentColor'>
      <circle cx='54' cy='54.0796' r='12' />
      <circle cx='24' cy='24' r='6' />
      <circle cx='84' cy='84' r='6' />
      <circle cx='84' cy='24' r='6' />
      <circle cx='24' cy='84' r='6' />
    </g>

    <g stroke='currentColor' strokeWidth='4' strokeLinecap='round'>
      <circle cx='54' cy='54' r='28' className='scale-on-toggle' />
      <path d='M24 24L84 84' />
      <path d='M84 24L24 84' />
    </g>
  </svg>
))
