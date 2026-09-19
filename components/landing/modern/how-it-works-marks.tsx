import type { ReactNode } from "react"

/**
 * Geometric marks for the three "how it works" steps — same circle-only
 * vocabulary as the goals scroll story. The 40 grid renders at 104–128px, so the
 * stroke is scaled down from 1.5 to land on the same rendered hairline width as
 * the goals illustration. `non-scaling-stroke` would match it exactly but
 * breaks the dasharray the stroke-draw animation relies on. Per-circle
 * `stroke-opacity` survives that animation, which only touches element
 * `opacity`.
 */

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.5}
      className="size-full overflow-visible"
    >
      {children}
    </svg>
  )
}

/** See — four accounts gathered inside a single frame. */
function SeeMark() {
  return (
    <Mark>
      <circle cx="20" cy="20" r="13" />
      <circle cx="15.8" cy="15.8" r="3.6" strokeOpacity={0.55} />
      <circle cx="24.2" cy="15.8" r="3.6" strokeOpacity={0.55} />
      <circle cx="15.8" cy="24.2" r="3.6" strokeOpacity={0.55} />
      <circle cx="24.2" cy="24.2" r="3.6" fill="currentColor" stroke="none" />
    </Mark>
  )
}

/** Ask — layers of context resolving into one clear reading. */
function AskMark() {
  return (
    <Mark>
      <circle cx="14.15" cy="20" r="10.5" strokeOpacity={0.2} />
      <circle cx="18.05" cy="20" r="10.5" strokeOpacity={0.4} />
      <circle cx="21.95" cy="20" r="10.5" strokeOpacity={0.65} />
      <circle cx="25.85" cy="20" r="10.5" />
    </Mark>
  )
}

/** Decide — two options, one of them settled on. */
function DecideMark() {
  return (
    <Mark>
      <circle cx="14.5" cy="20" r="10.5" strokeOpacity={0.4} />
      <circle cx="25.5" cy="20" r="10.5" />
      <circle cx="25.5" cy="20" r="3.6" fill="currentColor" stroke="none" />
    </Mark>
  )
}

export const HOW_IT_WORKS_MARKS = [SeeMark, AskMark, DecideMark]
