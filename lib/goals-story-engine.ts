import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { ensureGsapScroll } from "@/lib/gsap-scroll"

export type CircleState = {
  x: number
  y: number
  r: number
  /** Stroke opacity. */
  o: number
  /** Fill opacity. */
  f: number
}

type AmbientWeights = {
  w1: number
  w2: number
  w3: number
  w4: number
}

type TwinkleParams = { f: number; ph: number } | null

type DriftParams = {
  dx: number
  dy: number
  amp: number
  f: number
  ph: number
}

type JitterParams = {
  a: number
  f: number
  ph: number
}

type LfValue = { v: number }

export type GoalsStoryDom = {
  story: HTMLElement
  hint: HTMLElement
  blocks: HTMLElement[]
  bars: HTMLElement[]
  poolEls: SVGCircleElement[]
  pings: SVGGElement
  pg1: SVGCircleElement
  pg2: SVGCircleElement
  pings4: SVGGElement
}

const CX = 240
const CY = 206

/** 01 — a block of touching circles. */
const GRID_COLS = 7
const GRID_ROWS = 5
const GRID_STEP = 56
const GRID_R = 27
const GRID_X0 = CX - (GRID_COLS * GRID_STEP) / 2 + GRID_STEP / 2
const GRID_Y0 = CY - (GRID_ROWS * GRID_STEP) / 2 + GRID_STEP / 2

export const GOALS_STORY_POOL_SIZE = GRID_COLS * GRID_ROWS
const N = GOALS_STORY_POOL_SIZE

/** Four grid cells that survive every stage, plus the centre cell. */
const H0 = 1 * GRID_COLS + 2
const H1 = 1 * GRID_COLS + 4
const H2 = 3 * GRID_COLS + 2
const H3 = 3 * GRID_COLS + 4
const HEROES = [H0, H1, H2, H3]
const DOT = 2 * GRID_COLS + 3
const SIGNAL = H0

/** 02 — the same four circles, pulled apart into quadrants. */
const QUAD_R = 72
const QUAD: Record<number, [number, number]> = {
  [H0]: [CX - QUAD_R, CY - QUAD_R],
  [H1]: [CX + QUAD_R, CY - QUAD_R],
  [H2]: [CX - QUAD_R, CY + QUAD_R],
  [H3]: [CX + QUAD_R, CY + QUAD_R],
}
const QUAD_O: Record<number, number> = { [H0]: 0.4, [H1]: 1, [H2]: 0.82, [H3]: 0.32 }

/** 03 — the same four, overlapping so every edge runs through one point. */
const PETAL_R = 72
const PETAL: Record<number, [number, number]> = {
  [H0]: [CX, CY - PETAL_R],
  [H1]: [CX + PETAL_R, CY],
  [H3]: [CX, CY + PETAL_R],
  [H2]: [CX - PETAL_R, CY],
}

/** 04 — two concentric rings around a single point. */
const RING_OUTER = 152
const RING_INNER = 88
const DOT_R = 4.5

const HOLD = 1.4
const TR = 1.2
const STARTS = [HOLD, HOLD * 2 + TR, HOLD * 3 + TR * 2]
const TOTAL = HOLD * 4 + TR * 3
const STROKE_FLOOR = 0.22

const DIAG = Math.SQRT1_2
const OUTWARD: Record<number, [number, number]> = {
  [H0]: [-DIAG, -DIAG],
  [H1]: [DIAG, -DIAG],
  [H2]: [-DIAG, DIAG],
  [H3]: [DIAG, DIAG],
}

function gx(i: number) {
  return GRID_X0 + (i % GRID_COLS) * GRID_STEP
}

function gy(i: number) {
  return GRID_Y0 + Math.floor(i / GRID_COLS) * GRID_STEP
}

function mk(x: number, y: number, r: number, o: number, f: number): CircleState {
  return { x, y, r, o, f }
}

function off(x: number, y: number): CircleState {
  return mk(x, y, 0, 0, 0)
}

function copy(q: CircleState): CircleState {
  return mk(q.x, q.y, q.r, q.o, q.f)
}

function buildStageStates(): CircleState[][] {
  const S: CircleState[][] = [[], [], [], []]

  for (let i = 0; i < N; i++) {
    const x = gx(i)
    const y = gy(i)
    const hero = HEROES.includes(i)

    S[0][i] = mk(x, y, GRID_R, i === SIGNAL ? 1 : 0.4, i === SIGNAL ? 1 : 0)

    S[1][i] = hero ? mk(QUAD[i][0], QUAD[i][1], QUAD_R, QUAD_O[i], 0) : off(x, y)

    S[2][i] = hero ? mk(PETAL[i][0], PETAL[i][1], PETAL_R, 1, 0) : off(x, y)

    if (i === H0) S[3][i] = mk(CX, CY, RING_OUTER, 1, 0)
    else if (i === H1) S[3][i] = mk(CX, CY, RING_INNER, 1, 0)
    else if (i === DOT) S[3][i] = mk(CX, CY, DOT_R, 0, 1)
    else S[3][i] = off(CX, CY)
  }

  return S
}

export function initGoalsStory(dom: GoalsStoryDom) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const amb = reduce ? 0 : 1

  const S = buildStageStates()
  const st: CircleState[] = []
  const els = dom.poolEls

  for (let i = 0; i < N; i++) {
    st.push(copy(S[0][i]))
  }

  const W: AmbientWeights = { w1: 1, w2: 0, w3: 0, w4: 0 }
  const Lf: LfValue = { v: 0 }

  const TW: TwinkleParams[] = []
  const DR: Record<number, DriftParams> = {}
  const JA: Record<number, JitterParams> = {}

  for (let i = 0; i < N; i++) {
    TW[i] = i === SIGNAL ? null : { f: 0.6 + (((i * 29) % 11) / 11) * 0.9, ph: (i * 2.399) % 6.28 }
  }

  HEROES.forEach((id, k) => {
    DR[id] = {
      dx: OUTWARD[id][0],
      dy: OUTWARD[id][1],
      amp: 7,
      f: 0.42 + k * 0.07,
      ph: k * 1.9,
    }
    JA[id] = { a: 1.8, f: 4.6 + k * 0.6, ph: k * 1.7 }
  })

  const px = new Array<number>(N).fill(0)
  const py = new Array<number>(N).fill(0)
  const hidden = new Array<boolean>(N).fill(false)

  const render = () => {
    const t = performance.now() / 1000
    const ringBreath = amb * W.w4 * 2 * Math.sin(t * 0.6)
    const dotBreath = amb * W.w4 * 0.6 * Math.sin(t * 0.9)

    for (let k = 0; k < N; k++) {
      const s = st[k]
      let x = s.x
      let y = s.y
      let r = s.r
      let so = s.o
      const dr = DR[k]
      const ja = JA[k]

      if (dr && W.w2 > 0) {
        const qv = Math.sin(t * dr.f + dr.ph) * dr.amp * W.w2 * amb
        x += dr.dx * qv
        y += dr.dy * qv
      }

      if (ja && W.w3 > 0) {
        const a = ja.a * W.w3 * amb
        x += a * (Math.sin(t * ja.f + ja.ph) + 0.5 * Math.sin(t * ja.f * 1.9 + ja.ph * 2))
        y += a * (Math.cos(t * ja.f * 0.9 + ja.ph) + 0.5 * Math.sin(t * ja.f * 2.1 + ja.ph))
      }

      if (W.w4 > 0) {
        if (k === H0 || k === H1) r += ringBreath
        else if (k === DOT) r += dotBreath
      }

      if (TW[k] && W.w1 > 0) {
        const tw = amb ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * TW[k]!.f + TW[k]!.ph)) : 0.9
        so = s.o * (1 - W.w1 * (1 - tw))
      }

      if (s.o > 0 && so > 0) so = Math.max(STROKE_FLOOR, so)

      r = Math.max(0, r)
      px[k] = x
      py[k] = y

      const e = els[k]

      if (r < 0.05 || (so < 0.002 && s.f < 0.002)) {
        if (!hidden[k]) {
          e.setAttribute("r", "0")
          hidden[k] = true
        }
        continue
      }

      hidden[k] = false
      e.setAttribute("cx", x.toFixed(2))
      e.setAttribute("cy", y.toFixed(2))
      e.setAttribute("r", r.toFixed(2))
      e.setAttribute("stroke-opacity", so.toFixed(3))
      e.setAttribute("fill-opacity", s.f.toFixed(3))
    }

    dom.pings.setAttribute("opacity", (W.w1 * amb).toFixed(3))
    const signalR = Math.max(0, st[SIGNAL].r).toFixed(2)
    dom.pg1.setAttribute("cx", px[SIGNAL].toFixed(2))
    dom.pg1.setAttribute("cy", py[SIGNAL].toFixed(2))
    dom.pg1.setAttribute("r", signalR)
    dom.pg2.setAttribute("cx", px[SIGNAL].toFixed(2))
    dom.pg2.setAttribute("cy", py[SIGNAL].toFixed(2))
    dom.pg2.setAttribute("r", signalR)

    dom.pings4.setAttribute("opacity", (Lf.v * amb).toFixed(3))
  }

  if (reduce) {
    dom.story.setAttribute("data-reduced-motion", "true")

    for (let i = 0; i < N; i++) {
      st[i] = copy(S[3][i])
    }
    W.w1 = 0
    W.w2 = 0
    W.w3 = 0
    W.w4 = 1
    Lf.v = 1

    dom.blocks.forEach((block, index) => {
      block.setAttribute("aria-hidden", index === 3 ? "false" : "true")
      block.style.opacity = index === 3 ? "1" : "0"
      block.style.visibility = index === 3 ? "visible" : "hidden"
    })
    dom.bars.forEach((bar, index) => {
      bar.style.setProperty("--bar-fill", index === 3 ? "1" : "0.14")
    })
    dom.hint.style.opacity = "0"
    dom.hint.style.visibility = "hidden"

    render()
    return () => {
      dom.story.removeAttribute("data-reduced-motion")
    }
  }

  ensureGsapScroll()

  const { blocks, bars, hint } = dom
  let lastStage = -1

  const ctx = gsap.context(() => {
    gsap.set(blocks.slice(1), { autoAlpha: 0, y: 28 })
    gsap.set(bars.slice(1), { "--bar-fill": 0.14 })
    gsap.set(bars[0], { "--bar-fill": 1 })

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: dom.story,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
        onUpdate(self) {
          const tt = self.progress * TOTAL
          const s =
            tt < STARTS[0] + 0.6 ? 0 : tt < STARTS[1] + 0.6 ? 1 : tt < STARTS[2] + 0.6 ? 2 : 3
          if (s !== lastStage) {
            lastStage = s
            blocks.forEach((b, ix) => {
              b.setAttribute("aria-hidden", ix === s ? "false" : "true")
            })
          }
        },
      },
    })

    tl.to(hint, { opacity: 0, duration: 0.4 }, 0.1)

    for (let k = 0; k < 3; k++) {
      const T = STARTS[k]

      for (let n = 0; n < N; n++) {
        const tg = S[k + 1][n]
        const d = HEROES.includes(n) ? 0 : 0.05 + 0.3 * (((n * 37) % N) / (N - 1))
        tl.to(st[n], { x: tg.x, y: tg.y, r: tg.r, o: tg.o, f: tg.f, duration: 0.85 }, T + d)
      }

      const o1: gsap.TweenVars & Record<string, number> = { duration: 0.9 }
      o1[`w${k + 1}`] = 0
      tl.to(W, o1, T)

      const o2: gsap.TweenVars & Record<string, number> = { duration: 0.9 }
      o2[`w${k + 2}`] = 1
      tl.to(W, o2, T + 0.3)

      tl.to(blocks[k], { autoAlpha: 0, y: -28, duration: 0.45, ease: "power2.in" }, T)
      tl.to(blocks[k + 1], { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, T + 0.65)

      tl.to(bars[k], { "--bar-fill": 0.14, duration: 0.4 }, T + 0.2)
      tl.to(bars[k + 1], { "--bar-fill": 1, duration: 0.4 }, T + 0.6)
    }

    tl.to(Lf, { v: 1, duration: 0.5 }, STARTS[2] + 0.7)
    tl.to({}, { duration: 0.01 }, TOTAL - 0.01)
  }, dom.story)

  gsap.ticker.add(render)
  render()

  const refresh = () => ScrollTrigger.refresh()
  if (document.fonts?.ready) {
    document.fonts.ready.then(refresh)
  }
  window.addEventListener("load", refresh)

  return () => {
    window.removeEventListener("load", refresh)
    gsap.ticker.remove(render)
    ctx.revert()
  }
}

export const GOALS_STORY_COPY = [
  {
    heading: "Too much noise",
    sub: "Most of it never changes what you should do.",
  },
  {
    heading: "Money everywhere",
    sub: "Bank, cards, and savings don’t talk to each other.",
  },
  {
    heading: "Hard to decide",
    sub: "Every choice feels equally urgent.",
  },
  {
    heading: "One place to ask",
    sub: "Your AI assistant. Plain answers, in your context.",
  },
] as const
