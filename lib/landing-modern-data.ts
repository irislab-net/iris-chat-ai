import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BrainCircuit,
  Crosshair,
  Eye,
  Fingerprint,
  Handshake,
  Layers,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Unplug,
  Volume2,
} from "lucide-react"

export type MarketNode = {
  id: string
  label: string
  title: string
  delta: string
  desc: string
  pos: [number, number]
  size: number
}

export type ProblemCard = {
  icon: LucideIcon
  title: string
  desc: string
}

export type Pillar = {
  num: string
  icon: LucideIcon
  title: string
  desc: string
}

export type DemoScenario = {
  id: string
  label: string
  signal: string
  verdict: string
  detail: string
}

export type VoiceExchange = {
  q: string
  a: string
}

export type RoadmapStage = {
  icon: LucideIcon
  name: string
  status: "Live Now" | "Next" | "The Path" | "Vision"
  desc: string
  tag: string
}

export const NAV_LINKS = [
  { label: "Intelligence", id: "intelligence" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Roadmap", id: "future" },
] as const

export const MARKET_NODES: MarketNode[] = [
  {
    id: "btc",
    label: "BTC · Price",
    title: "$124,380",
    delta: "+2.4% today",
    desc: "Momentum building above the 123K shelf. Buyers stay in control while 121.8K holds.",
    pos: [63, 16],
    size: 72,
  },
  {
    id: "xau",
    label: "XAU · News",
    title: "Gold at record high",
    delta: "Safe-haven bid",
    desc: "Real yields slipped after the Fed minutes. Exur flags rising gold-to-equity correlation.",
    pos: [16, 30],
    size: 60,
  },
  {
    id: "liq",
    label: "BTC · Liquidity Wall",
    title: "$420M sell wall",
    delta: "At $126.5K",
    desc: "A dense ask cluster caps the next leg. Expect chop until it clears or pulls.",
    pos: [82, 52],
    size: 78,
  },
  {
    id: "eth",
    label: "ETH · Funding",
    title: "Funding flips negative",
    delta: "-0.012%",
    desc: "Crowded shorts are fuel for a squeeze. Watch open interest on the next impulse.",
    pos: [26, 74],
    size: 56,
  },
  {
    id: "macro",
    label: "Macro · CPI",
    title: "CPI tomorrow 14:30",
    delta: "Consensus 2.9%",
    desc: "Volatility window opens. Exur suggests no new risk until the print lands.",
    pos: [68, 85],
    size: 62,
  },
  {
    id: "dxy",
    label: "DXY · Dollar",
    title: "Dollar fades 0.8%",
    delta: "3-week low",
    desc: "A softer dollar supports risk assets and metals. Trend intact below 103.",
    pos: [10, 55],
    size: 54,
  },
]

export const PROBLEM_CARDS: ProblemCard[] = [
  {
    icon: Volume2,
    title: "Information Overload",
    desc:
      "Charts, order books, news, economic data — thousands of signals, zero actionable clarity.",
  },
  {
    icon: Unplug,
    title: "Fragmented Reality",
    desc:
      "Brokers, banks, exchanges, wallets, taxes — none of them speak to each other.",
  },
  {
    icon: Scale,
    title: "Cognitive Friction",
    desc:
      "Every decision forces you to be trader, risk manager, and portfolio strategist at once.",
  },
]

export const PILLARS: Pillar[] = [
  {
    num: "01",
    icon: Eye,
    title: "Exur sees the market",
    desc:
      "Price, liquidity, order books, derivatives positioning, news, and macro — across BTC, ETH, and Gold, from 15-minute pulses to long-term structure.",
  },
  {
    num: "02",
    icon: SlidersHorizontal,
    title: "Models are engines. Not the product.",
    desc:
      "Layered machine intelligence turns a thousand signals into one calm, human sentence you can act on. No charts. No jargon. Just clarity.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Flat is a valid decision",
    desc:
      "Exur never manufactures a trade. When the market lacks a real edge, the honest answer is: do nothing. Protecting capital is the objective.",
  },
]

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "spike",
    label: "Market Spike",
    signal: "VOLATILITY +212% · LIQUIDITY THINNING",
    verdict: "Do nothing.",
    detail:
      "The move is driven by leveraged momentum, not fundamentals. Your allocation is built for this range. Exur is watching the support zone.",
  },
  {
    id: "inflation",
    label: "Inflation Shock",
    signal: "CPI PRINT ABOVE CONSENSUS",
    verdict: "Rebalance 4%.",
    detail:
      "Real yields are repricing. Shifting a small sleeve to short-duration treasuries protects purchasing power without changing your long-term plan.",
  },
  {
    id: "subscription",
    label: "Subscription Audit",
    signal: "RECURRING OUTFLOW ANOMALY DETECTED",
    verdict: "Save $214/mo.",
    detail:
      "Three overlapping subscriptions found. Cancelling two redirects $2,568 a year toward your liquidity goal — no lifestyle change required.",
  },
  {
    id: "liquidity",
    label: "Liquidity Rebalance",
    signal: "CASH DRAG DETECTED · 6.1% IDLE",
    verdict: "Deploy gradually.",
    detail:
      "Idle cash exceeds your three-month buffer. Exur suggests staged deployment over six weeks to smooth entry risk.",
  },
]

export const VOICE_EXCHANGES: VoiceExchange[] = [
  {
    q: "What is BTC doing right now?",
    a:
      "BTC is losing momentum, but sellers haven't taken control yet. I'm not seeing enough edge to enter here — keep an eye on the current support zone. If it breaks, the situation changes.",
  },
  {
    q: "I want to buy a house next year.",
    a:
      "Then we protect the down payment. I'd increase liquidity and lower portfolio volatility starting this quarter — your goal changes the strategy, not the other way around.",
  },
  {
    q: "What should I do?",
    a: "Do nothing. You're fine.",
  },
]

export const ROADMAP_STAGES: RoadmapStage[] = [
  {
    icon: Activity,
    name: "AI Market Analyst",
    status: "Live Now",
    desc:
      "Multi-horizon intelligence across BTC, ETH, and Gold — the system running today, watching every pulse of the market.",
    tag: "Observe",
  },
  {
    icon: Crosshair,
    name: "Personal Market Intelligence",
    status: "Next",
    desc:
      "Market understanding tuned to your watchlist, your assets, your world — not the average investor's.",
    tag: "Personalize",
  },
  {
    icon: Fingerprint,
    name: "Financial Twin",
    status: "The Path",
    desc:
      "Exur learns you: assets, income, goals, risk tolerance, and the history of your decisions. Market model meets user model.",
    tag: "Understand",
  },
  {
    icon: Handshake,
    name: "Financial Agent",
    status: "The Path",
    desc:
      "From advice to action. Exur recommends, asks permission, and acts — always inside boundaries you define.",
    tag: "Act",
  },
  {
    icon: Layers,
    name: "Personal Wealth OS",
    status: "Vision",
    desc:
      "Earn, save, protect, invest, borrow, spend — one intelligence responsible for your entire financial layer.",
    tag: "Expand",
  },
  {
    icon: BrainCircuit,
    name: "Financial OS for Individuals",
    status: "Vision",
    desc:
      "The end state: the intelligent layer responsible for your financial life. Banks and brokers become infrastructure underneath.",
    tag: "Autonomy",
  },
]

export function roadmapStatusClass(status: RoadmapStage["status"]) {
  switch (status) {
    case "Live Now":
      return "bg-[#2563EB] text-white"
    case "Next":
      return "border border-[#2563EB]/40 text-[#2563EB]"
    case "Vision":
      return "border border-[#7C3AED]/40 text-[#7C3AED]"
    default:
      return "border border-black/10 text-[#868C98]"
  }
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
