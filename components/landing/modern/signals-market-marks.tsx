import type { ComponentType, ReactNode } from "react"

/**
 * Signals market marks — one line system for every asset:
 *
 * - hairline 0.5, round caps/joins (same Mark shell)
 * - primary silhouette at full opacity
 * - optional recess lines at exactly 0.45 (one secondary value only)
 * - no fills — fill accents made the set feel mixed
 * - coin assets share the same r=13 ring as how-it-works outers
 */

const RECESS = 0.45

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-full overflow-visible"
    >
      {children}
    </svg>
  )
}

function CoinRing() {
  return <circle cx="20" cy="20" r="13" />
}

function BtcMark() {
  return (
    <Mark>
      <CoinRing />
      <g transform="translate(8 8)">
        <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727" />
      </g>
    </Mark>
  )
}

function EthMark() {
  return (
    <Mark>
      <CoinRing />
      <path d="M20 9.5L12.5 20.2l7.5 4.4 7.5-4.4L20 9.5z" />
      <path d="M12.5 20.2L20 24.6l7.5-4.4" strokeOpacity={RECESS} />
      <path d="M12.5 21.6L20 30.5l7.5-8.9" />
    </Mark>
  )
}

function XauMark() {
  return (
    <Mark>
      <CoinRing />
      <path d="M17.1 12.8H22.9L24.2 17.4H15.8Z" />
      <path d="M11.6 20H17.4L18.7 24.6H10.3Z" strokeOpacity={RECESS} />
      <path d="M22.6 20H28.4L29.7 24.6H21.3Z" strokeOpacity={RECESS} />
    </Mark>
  )
}

function SolMark() {
  return (
    <Mark>
      <path d="M11 13.2h15.2c1.15 0 1.75 1.4.9 2.2l-2 2H10.1c-1.15 0-1.75-1.4-.9-2.2l1.8-2z" />
      <path
        d="M11 18.6h15.2c1.15 0 1.75 1.4.9 2.2l-2 2H10.1c-1.15 0-1.75-1.4-.9-2.2l1.8-2z"
        strokeOpacity={RECESS}
      />
      <path d="M11 24h15.2c1.15 0 1.75 1.4.9 2.2l-2 2H10.1c-1.15 0-1.75-1.4-.9-2.2l1.8-2z" />
    </Mark>
  )
}

function BnbMark() {
  return (
    <Mark>
      <path d="M20 7L23.8 10.8 20 14.6 16.2 10.8 20 7z" />
      <path d="M11 16L14.8 19.8 11 23.6 7.2 19.8 11 16z" />
      <path d="M29 16L32.8 19.8 29 23.6 25.2 19.8 29 16z" />
      <path d="M20 25L23.8 28.8 20 32.6 16.2 28.8 20 25z" />
      <path
        d="M16.8 20L20 16.8 23.2 20 20 23.2 16.8 20z"
        strokeOpacity={RECESS}
      />
    </Mark>
  )
}

function XrpMark() {
  return (
    <Mark>
      <path d="M20 8c0 0-7.2 6.9-7.2 10.8 0 2.7 2.1 5.1 7.2 5.1" />
      <path
        d="M20 8c0 0 7.2 6.9 7.2 10.8 0 2.7-2.1 5.1-7.2 5.1"
        strokeOpacity={RECESS}
      />
      <path
        d="M12.8 28.2c2.1-2.7 4.4-4 7.2-4s5.1 1.3 7.2 4"
        strokeOpacity={RECESS}
      />
    </Mark>
  )
}

function LinkMark() {
  return (
    <Mark>
      <path d="M20 7L30.5 13.2v13.6L20 33 9.5 26.8V13.2L20 7z" />
      <path
        d="M20 14L26 17.4v7.2L20 28l-6-3.4v-7.2L20 14z"
        strokeOpacity={RECESS}
      />
    </Mark>
  )
}

function AvaxMark() {
  return (
    <Mark>
      <path d="M20 8.5L28 32H12L20 8.5z" />
      <path d="M12.5 32L17 19.5 20 29" strokeOpacity={RECESS} />
      <path d="M27.5 32L23 19.5 20 29" strokeOpacity={RECESS} />
    </Mark>
  )
}

function DogeMark() {
  return (
    <Mark>
      <CoinRing />
      <path d="M15.2 12.2v15.6h5.4c4.2 0 7-2.6 7-7.8s-2.8-7.8-7-7.8H15.2z" />
      <path d="M15.2 20h9" strokeOpacity={RECESS} />
    </Mark>
  )
}

function ArbMark() {
  return (
    <Mark>
      <path d="M20 8L31.5 32H8.5L20 8z" />
      <path d="M14.2 24.8h11.6" strokeOpacity={RECESS} />
    </Mark>
  )
}

function OpMark() {
  return (
    <Mark>
      <CoinRing />
      <circle cx="20" cy="20" r="6.2" strokeOpacity={RECESS} />
    </Mark>
  )
}

export const SIGNALS_LIVE_MARKS = {
  btc: BtcMark,
  eth: EthMark,
  xau: XauMark,
} as const satisfies Record<string, ComponentType>

export const SIGNALS_SOON_MARKS = {
  sol: SolMark,
  bnb: BnbMark,
  xrp: XrpMark,
  link: LinkMark,
  avax: AvaxMark,
  doge: DogeMark,
  arb: ArbMark,
  op: OpMark,
} as const satisfies Record<string, ComponentType>
