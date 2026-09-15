import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Globe,
  GraduationCap,
  Layers,
  LineChart,
  Link2,
  MoreHorizontal,
  Scale,
  Sparkles,
  Unplug,
  Volume2,
  Wallet,
  Zap,
} from "lucide-react"

export const NAV_LINKS = [
  { label: "Intelligence", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
] as const

export const HERO = {
  badge: "The intelligence layer between you and the financial world",
  titleBefore: "Your Financial",
  titleAfter: "Brain.",
  subtitle:
    "Exur understands the markets, learns your financial life, and helps you make better decisions with your money — today, and eventually on your behalf.",
  inputPlaceholder: "What is BTC doing right now?",
  socialProof: "Join thousands already growing with Exur",
} as const

export const HERO_CHIPS = [
  { label: "Markets", icon: LineChart },
  { label: "Portfolio", icon: Wallet },
  { label: "Macro", icon: Globe },
  { label: "Advice", icon: GraduationCap },
  { label: "More", icon: MoreHorizontal },
] as const

export const TRUSTED_LOGOS = [
  { name: "Arcline", icon: Zap },
  { name: "Vault", icon: Layers },
  { name: "Northstar", icon: Sparkles },
  { name: "Ledger", icon: Link2 },
  { name: "Pulse", icon: Activity },
] as const

export const FEATURES_SECTION = {
  badge: "Chapter 01 / The Noise",
  title: "Your money shouldn't require a team of experts.",
  subtitle:
    "Institutions solved this years ago — with analysts, risk managers, data scientists, and infrastructure watching their capital around the clock. Individuals got apps, charts, and notifications.",
  highlight:
    "Exur compresses that institutional capability into one intelligent personal system. Institutional-grade financial intelligence — personal, conversational, autonomous, always available.",
} as const

export type GoalCard = {
  icon: LucideIcon
  title: string
  desc: string
}

export const GOAL_CARDS: GoalCard[] = [
  {
    icon: Volume2,
    title: "Information Overload",
    desc:
      "Charts, order books, news, economic data — thousands of signals, zero actionable clarity.",
  },
  {
    icon: Unplug,
    title: "Fragmented Reality",
    desc: "Brokers, banks, exchanges, wallets, taxes — none of them speak to each other.",
  },
  {
    icon: Scale,
    title: "Cognitive Friction",
    desc:
      "Every decision forces you to be trader, risk manager, and portfolio strategist at once.",
  },
]

export const MEET_EXUR_SECTION = {
  badge: "Autonomous Personal Finance",
  title: "Meet Your Financial Brain.",
  subtitle:
    "The intelligence is ready. Not a chatbot. Not a trading bot. An always-on financial intelligence that observes, understands, protects, and decides — for one person.",
  quote: "I am the intelligent layer responsible for your financial life.",
  tagline: "You + Your Money + The Markets + The World",
} as const

export const ARCHITECTURE_SECTION = {
  badge: "Chapter 02 / The Architecture",
  title: "How Exur thinks.",
} as const

export type PillarCard = {
  num: string
  title: string
  desc: string
}

export const PILLAR_CARDS: PillarCard[] = [
  {
    num: "01",
    title: "Exur sees the market",
    desc:
      "Price, liquidity, order books, derivatives, news, and macro — across BTC, ETH, and Gold. The full picture, always on.",
  },
  {
    num: "02",
    title: "Models are engines. Not the product.",
    desc:
      "Layered intelligence turns raw signals into a calm, human sentence — not a dashboard, not a model card.",
  },
  {
    num: "03",
    title: "Flat is a valid decision",
    desc:
      "Exur never manufactures a trade. When there is no edge, the honest answer is: do nothing.",
  },
]

export type DemoScenario = {
  id: string
  label: string
  trigger: string
  verdict: string
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "spike",
    label: "Market Spike",
    trigger: "BTC breaks above 125K with heavy volume.",
    verdict:
      "Momentum is real but stretched. No new entry — if you're already positioned, hold with a trailing stop. If flat, wait for a pullback to structure.",
  },
  {
    id: "inflation",
    label: "Inflation Shock",
    trigger: "CPI comes in hot. Risk assets sell off across the board.",
    verdict:
      "Macro regime shift, not a trade. Reduce risk exposure by 15–20%, increase cash. This is protection, not panic.",
  },
  {
    id: "subscriptions",
    label: "Subscription Audit",
    trigger: "User asks: where is my money actually going each month?",
    verdict:
      "Found $340/mo in recurring charges you haven't used in 90+ days. Cancel 4 services, redirect $180/mo to your savings goal.",
  },
  {
    id: "rebalance",
    label: "Liquidity Rebalance",
    trigger: "Portfolio is 80% crypto. User wants to buy a house in 18 months.",
    verdict:
      "Goal changed the strategy. Shift 30% to stable liquidity over the next 6 weeks. Your down payment is now the priority.",
  },
]

export const BENTO_INTEGRATION = {
  title: "Exur sees the market",
  desc:
    "Price, liquidity, order books, derivatives, news, and macro — unified across BTC, ETH, and Gold into one always-on intelligence layer.",
  icons: ["BTC", "ETH", "XAU", "CPI", "DXY"],
}

export const BENTO_MULTIMODAL = {
  title: "Models are engines. Not the product.",
  desc:
    "Layered intelligence turns raw signals into a calm, human sentence — from quick questions to long-term planning.",
}

export const COMPANION_SECTION = {
  badge: "Chapter 03 / The Relationship",
  title: "Not a terminal. A companion.",
  subtitle:
    "You will never see a model name, an API, or a data pipeline. You talk. Exur understands the infrastructure underneath — and answers like an intelligent friend who happens to watch every market, all the time.",
  quote: "Exur is watching this for me.",
  quoteAttribution: "how it should feel, every day",
} as const

export type VoiceExchange = {
  question: string
  answer: string
}

export const VOICE_EXCHANGES: VoiceExchange[] = [
  {
    question: "What is BTC doing right now?",
    answer:
      "BTC is losing momentum, but sellers haven't taken control yet. I'm not seeing enough edge to enter here — keep an eye on the current support zone. If it breaks, the situation changes.",
  },
  {
    question: "I want to buy a house next year.",
    answer:
      "Then we protect the down payment. I'd increase liquidity and lower portfolio volatility starting this quarter — your goal changes the strategy, not the other way around.",
  },
  {
    question: "What should I do?",
    answer: "Do nothing. You're fine.",
  },
]

export type PricingPlan = {
  key: string
  name: string
  price: string
  desc: string
  cta: string
  features: string[]
  featured?: boolean
  badge?: string
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "starter",
    name: "Starter Plan",
    price: "Free",
    desc: "Start watching the markets with Exur's core intelligence.",
    cta: "Start for Free",
    features: [
      "Market news & scored headlines",
      "Exur co-pilot chat",
      "BTC, ETH & Gold coverage",
      "Community support",
      "1 user seat",
    ],
  },
  {
    key: "pro",
    name: "Pro Plan",
    price: "$49",
    desc: "Full intelligence for active investors who want depth and speed.",
    cta: "Upgrade to Pro",
    featured: true,
    badge: "Popular",
    features: [
      "Unlimited co-pilot sessions",
      "Priority market signals",
      "Paper trading desk",
      "Priority email support",
      "Up to 5 user seats",
      "Saved watchlists & history",
    ],
  },
  {
    key: "ultimate",
    name: "Ultimate Plan",
    price: "Custom",
    desc: "Enterprise depth for teams and desks that need custom limits and a direct line to us.",
    cta: "Contact Us",
    badge: "Teams",
    features: [
      "Everything in Pro",
      "Custom intelligence limits",
      "Team workspaces & onboarding",
      "Dedicated support line",
      "Unlimited seats",
      "Custom integrations",
    ],
  },
]

export const FOOTER_CTA = {
  title: "Meet Your Financial Brain.",
  subtitle:
    "The intelligence is ready. Not a chatbot. Not a trading bot. An always-on financial intelligence that observes, understands, protects, and decides — for one person.",
  tagline: "You + Your Money + The Markets + The World",
} as const

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
