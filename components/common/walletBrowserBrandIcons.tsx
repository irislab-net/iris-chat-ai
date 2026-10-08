import type { SVGProps } from "react"

type BrandIconProps = SVGProps<SVGSVGElement>

export function SafariBrandIcon(props: BrandIconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      role='img'
      aria-label='Safari'
      {...props}
    >
      <defs>
        <linearGradient id='wbi-safari-rim' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#1ea2f1' />
          <stop offset='1' stopColor='#0064d2' />
        </linearGradient>
      </defs>
      <circle cx='12' cy='12' r='11' fill='url(#wbi-safari-rim)' />
      <circle cx='12' cy='12' r='8.5' fill='#f4f6f8' />
      <g transform='rotate(-45 12 12)'>
        <polygon points='12,10.8 20,12 12,13.2' fill='#e53935' />
        <polygon points='12,10.8 4,12 12,13.2' fill='#fff' />
      </g>
      <circle cx='12' cy='12' r='0.9' fill='#0064d2' />
    </svg>
  )
}

export function ChromeBrandIcon(props: BrandIconProps) {
  return (
    <svg
      viewBox='0 0 48 48'
      xmlns='http://www.w3.org/2000/svg'
      role='img'
      aria-label='Chrome'
      {...props}
    >
      <defs>
        <linearGradient
          id='wbi-chrome-red'
          x1='3.2173'
          y1='15'
          x2='44.7812'
          y2='15'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0' stopColor='#d93025' />
          <stop offset='1' stopColor='#ea4335' />
        </linearGradient>
        <linearGradient
          id='wbi-chrome-yellow'
          x1='20.7219'
          y1='47.6791'
          x2='41.5039'
          y2='11.6837'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0' stopColor='#fcc934' />
          <stop offset='1' stopColor='#fbbc04' />
        </linearGradient>
        <linearGradient
          id='wbi-chrome-green'
          x1='26.5981'
          y1='46.5015'
          x2='5.8161'
          y2='10.506'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0' stopColor='#1e8e3e' />
          <stop offset='1' stopColor='#34a853' />
        </linearGradient>
      </defs>
      <circle cx='24' cy='23.9947' r='12' fill='#fff' />
      <path
        d='M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z'
        fill='url(#wbi-chrome-red)'
      />
      <circle cx='24' cy='24' r='9.5' fill='#1a73e8' />
      <path
        d='M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z'
        fill='url(#wbi-chrome-yellow)'
      />
      <path
        d='M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z'
        fill='url(#wbi-chrome-green)'
      />
    </svg>
  )
}

export function TrustWalletBrandIcon(props: BrandIconProps) {
  return (
    <svg
      viewBox='0 0 512 512'
      xmlns='http://www.w3.org/2000/svg'
      role='img'
      aria-label='Trust Wallet'
      fillRule='evenodd'
      clipRule='evenodd'
      strokeLinejoin='round'
      strokeMiterlimit={2}
      {...props}
    >
      <defs>
        <linearGradient
          id='wbi-trust-fill'
          x1='0'
          y1='0'
          x2='1'
          y2='0'
          gradientUnits='userSpaceOnUse'
          gradientTransform='matrix(-13.59 43.32 -43.32 -13.59 374.34 134.86)'
        >
          <stop offset='0' stopColor='#0000ff' />
          <stop offset='0.02' stopColor='#0000ff' />
          <stop offset='0.08' stopColor='#0094ff' />
          <stop offset='0.16' stopColor='#48ff91' />
          <stop offset='0.42' stopColor='#0094ff' />
          <stop offset='0.68' stopColor='#0038ff' />
          <stop offset='0.9' stopColor='#0500ff' />
          <stop offset='1' stopColor='#0500ff' />
        </linearGradient>
      </defs>
      <path
        d='M37.523 83.593L255.21 13.046v488.371C99.709 436.301 37.523 311.5 37.523 240.964V83.593z'
        fill='#0500ff'
        fillRule='nonzero'
      />
      <path
        d='M255.21 13.046l217.687 70.547v157.371c0 70.536-62.186 195.337-217.687 260.453V13.046z'
        fill='url(#wbi-trust-fill)'
        fillRule='nonzero'
      />
    </svg>
  )
}

export function MetaMaskBrandIcon(props: BrandIconProps) {
  return (
    <svg
      viewBox='0 0 318.6 318.6'
      xmlns='http://www.w3.org/2000/svg'
      role='img'
      aria-label='MetaMask'
      {...props}
    >
      <path
        d='m274.1 35.5-99.5 73.9L193 65.8z'
        fill='#e2761b'
        stroke='#e2761b'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m44.4 35.5 98.7 74.6-17.5-44.3zm193.9 171.3-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z'
        fill='#e4761b'
        stroke='#e4761b'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zm111.3 0-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5 33.9 16.5-4.7-39.3z'
        fill='#e4761b'
        stroke='#e4761b'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zm-105 0 31.5 14.9-.2-9.3 2.5-22.1z'
        fill='#d7c1b3'
        stroke='#d7c1b3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m138.8 193.5-28.2-8.3 19.9-9.1zm40.9 0 8.3-17.4 20 9.1z'
        fill='#233447'
        stroke='#233447'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1 20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z'
        fill='#cd6116'
        stroke='#cd6116'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m87.8 162.1 23.6 46-.8-22.9zm120.3 23.1-1 22.9 23.7-46zm-64-20.6-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0-2.7 18 1.2 45 6.7-34.1z'
        fill='#e4751f'
        stroke='#e4751f'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z'
        fill='#f6851b'
        stroke='#f6851b'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z'
        fill='#c0ad9e'
        stroke='#c0ad9e'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z'
        fill='#161616'
        stroke='#161616'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z'
        fill='#763d16'
        stroke='#763d16'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4 3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z'
        fill='#f6851b'
        stroke='#f6851b'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function PhantomBrandIcon(props: BrandIconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      role='img'
      aria-label='Phantom'
      {...props}
    >
      <circle cx='12' cy='12' r='11' fill='#ab9ff2' />
      <path
        fill='#ffffff'
        d='M6.13 16.2c1.53 0 2.682-1.28 3.369-2.29a1.93 1.93 0 0 0-.13.662c0 .59.353 1.011 1.049 1.011c.955 0 1.977-.805 2.505-1.673a1.33 1.33 0 0 0-.055.35c0 .411.241.67.733.67c1.55 0 3.108-2.639 3.108-4.948c0-1.79-.947-3.382-3.324-3.382c-4.176 0-8.677 4.903-8.677 8.07c0 1.245.696 1.53 1.422 1.53m5.819-6.414c0-.448.26-.761.64-.761c.371 0 .631.313.631.761c0 .447-.26.77-.631.77c-.38 0-.64-.323-.64-.77m1.986 0c0-.448.26-.761.64-.761c.371 0 .631.313.631.761c0 .447-.26.77-.631.77c-.38 0-.64-.323-.64-.77'
      />
    </svg>
  )
}
