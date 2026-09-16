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
  { label: "Why Exur", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "About", id: "about" },
  { label: "Stories", id: "testimonials" },
  { label: "Pricing", id: "pricing" },
] as const

export const LANDING_DOT_SECTIONS = [
  { id: "top", label: "Home" },
  { id: "features", label: "Why Exur" },
  { id: "how-it-works", label: "How it works" },
  { id: "about", label: "About" },
  { id: "testimonials", label: "Stories" },
  { id: "pricing", label: "Pricing" },
] as const

export const HERO = {
  badge: "Markets, money, and you in one place",
  titleBefore: "Your Financial",
  titleAfter: "Brain.",
  subtitle: "Ask anything about your money or the markets. Get a clear answer.",
  inputPlaceholder: "What is BTC doing right now?",
  socialProof: "Thousands already use Exur",
} as const

export const HERO_DEMO_EXCHANGES = [
  {
    question: "What is BTC doing right now?",
    answer:
      "Up 2.4% today, breaking resistance on volume. Momentum looks real. Hold if you're in, wait for a dip if you're not.",
  },
  {
    question: "CPI came in hot. What now?",
    answer:
      "Dial back risk and keep more cash. It's protection, not panic.",
  },
  {
    question: "Where is my money going each month?",
    answer:
      "About $340/mo in subscriptions you haven't touched in 90 days. Cut those first.",
  },
  {
    question: "Still hold ETH after this rally?",
    answer:
      "Yes, but stay measured. Support held near $3.2K. Add on dips, don't chase.",
  },
  {
    question: "Summarize today in one line.",
    answer:
      "Risk-on, with yields ticking up. Small, selective moves beat big bets today.",
  },
  {
    question: "80% tech. Too concentrated?",
    answer:
      "A bit heavy. Spread across a core index, some cash, and a few names you know well.",
  },
  {
    question: "Fed tomorrow. How do I position?",
    answer:
      "Trade smaller before the print. Let the first move settle, then decide.",
  },
  {
    question: "AAPL earnings tonight. What's the move?",
    answer:
      "It's a coin flip. Size down, or wait for guidance after the call.",
  },
  {
    question: "Move cash into gold now?",
    answer:
      "Only as a small hedge, maybe 5-10% max. Insurance, not your main bet.",
  },
] as const

export const HERO_VIDEO = {
  src:
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4",
  heading: "YOUR FINANCIAL BRAIN.",
  subtext: "Clear answers about money and markets. No jargon.",
} as const

export const ABOUT_DEMO_VIDEO = {
  src:
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4",
  poster: undefined as string | undefined,
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
  badge: "Why Exur",
  title: "One brain for your money.",
  subtitle: "Less noise. Clearer answers.",
} as const

export type FeatureScrollVisual = "noise" | "split" | "stress" | "exur"

export type FeatureVisualRowState = "active" | "muted" | "conflict" | "resolved"

export type FeatureVisualRow = {
  title: string
  meta?: string
  state?: FeatureVisualRowState
}

export type FeatureScrollStep = {
  id: string
  step: string
  label: string
  title: string
  ask: string
  panelTitle: string
  panelDesc: string
  icon: LucideIcon
  visual: FeatureScrollVisual
  visualStatus?: string
  visualRows?: readonly FeatureVisualRow[]
  visualOverflow?: string
  visualAnswer?: string
}

export const FEATURE_SCROLL_STEPS: FeatureScrollStep[] = [
  {
    id: "noise",
    step: "01",
    label: "Noise",
    title: "Too much information",
    ask: "What's actually worth my attention today?",
    panelTitle: "The feed never stops",
    panelDesc:
      "Charts, headlines, and alerts pile up fast. Most of it never changes what you should do.",
    icon: Volume2,
    visual: "noise",
    visualStatus: "47 signals",
    visualOverflow: "+44 more today",
    visualRows: [
      { title: "BTC breaks resistance on volume", meta: "2m ago", state: "active" },
      { title: "Fed speaker at 2pm ET", meta: "14m ago", state: "muted" },
      { title: "ETH funding rate spikes", meta: "28m ago", state: "muted" },
    ],
  },
  {
    id: "split",
    step: "02",
    label: "Split",
    title: "Money everywhere",
    ask: "Where is my money even sitting right now?",
    panelTitle: "Everything lives in a different app",
    panelDesc:
      "Bank, broker, crypto, subscriptions. None of it talks to each other, so the full picture stays hidden.",
    icon: Unplug,
    visual: "split",
    visualStatus: "3 accounts",
    visualRows: [
      { title: "Chase Checking", meta: "$4,280", state: "muted" },
      { title: "Fidelity Brokerage", meta: "$128K", state: "muted" },
      { title: "Coinbase", meta: "$12.4K", state: "muted" },
    ],
  },
  {
    id: "stress",
    step: "03",
    label: "Stress",
    title: "Hard to decide",
    ask: "Am I making the right call here?",
    panelTitle: "Every choice feels heavy",
    panelDesc:
      "You end up playing trader, risk manager, and planner at once. That is a lot to hold in your head.",
    icon: Scale,
    visual: "stress",
    visualStatus: "No edge",
    visualRows: [
      { title: "Buy now", meta: "FOMO", state: "conflict" },
      { title: "Sell everything", meta: "Fear", state: "conflict" },
      { title: "Wait it out", meta: "Unclear", state: "conflict" },
    ],
  },
  {
    id: "exur",
    step: "04",
    label: "Exur",
    title: "One brain for your money",
    ask: "What should I do about all of this?",
    panelTitle: "Exur connects the dots",
    panelDesc:
      "It watches the market and your finances, then gives you a clear answer in plain language.",
    icon: Sparkles,
    visual: "exur",
    visualStatus: "1 action",
    visualRows: [{ title: "Hold current position", meta: "Low risk", state: "resolved" }],
    visualAnswer: "Hold steady. Your plan still makes sense.",
  },
]

export const MEET_EXUR_SECTION = {
  badge: "About Exur",
  title: "Meet your financial brain.",
  subtitle:
    "Not a chatbot. Not a trading bot. Just someone who watches your money and the markets, and explains what matters.",
  quote: "Finally, finance that speaks human.",
  tagline: "You, your money, and the market, connected",
} as const

export const ARCHITECTURE_SECTION = {
  badge: "How it works",
  title: "How Exur thinks.",
  subtitle: "Watch the market. Understand it. Move only when it makes sense.",
} as const

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Watch",
    headline: "Exur sees the market",
    desc: "Prices, news, and the big picture. All in one place.",
  },
  {
    step: "02",
    title: "Explain",
    headline: "Plain answers",
    desc: "No jargon. Just what changed and why it matters to you.",
  },
  {
    step: "03",
    title: "Decide",
    headline: "Sometimes, wait",
    desc: "If there's no good move, Exur says so. No fake urgency.",
  },
] as const

export const BENTO_DEMO_SECTION = {
  badge: "Live demo",
  title: "See Exur in action",
  subtitle: "Pick a situation. Get a straight answer.",
  situationLabel: "Situation",
  analyzing: "Exur is thinking…",
  verdictLabel: "Answer",
  verdictValue: "Clear and honest",
  cta: "Try Exur free",
} as const

export type DemoScenario = {
  id: string
  label: string
  trigger: string
  verdict: string
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "spike",
    label: "Market spike",
    trigger: "BTC just broke above $125K on heavy volume.",
    verdict:
      "Momentum looks real, but it's stretched. If you're already in, hold. If you're not, wait for a pullback. Don't chase.",
  },
  {
    id: "inflation",
    label: "Hot CPI",
    trigger: "Inflation came in higher than expected. Markets are selling off.",
    verdict:
      "This is a macro shift, not a quick trade. Trim risk a bit and keep more cash. Protection, not panic.",
  },
  {
    id: "subscriptions",
    label: "Where's my money?",
    trigger: "Where is my money actually going each month?",
    verdict:
      "About $340/mo in subscriptions you haven't used in 90 days. Cut four of them. That's $180/mo back in your pocket.",
  },
  {
    id: "rebalance",
    label: "Buying a home",
    trigger: "I'm 80% in crypto and want to buy a house in 18 months.",
    verdict:
      "Your goal changed the plan. Move 30% into safer, liquid assets over the next few weeks. The down payment comes first.",
  },
]

export const COMPANION_SECTION = {
  badge: "Stories",
  title: "Real questions. Real answers.",
  subtitle: "No dashboards. Just a conversation when you need one.",
  quote: "Exur's watching this for me.",
  quoteAttribution: "That's the point.",
} as const

export type VoiceExchange = {
  topic: string
  question: string
  answer: string
}

export const VOICE_EXCHANGES: VoiceExchange[] = [
  {
    topic: "Markets",
    question: "What is BTC doing right now?",
    answer:
      "Losing a bit of steam, but sellers aren't in control yet. I'd wait and watch support. If it breaks, we'll talk again.",
  },
  {
    topic: "Life goals",
    question: "I want to buy a house next year.",
    answer:
      "Then we protect the down payment first. More cash, less risk. Your goal sets the plan.",
  },
  {
    topic: "Clarity",
    question: "What should I do?",
    answer: "Nothing right now. You're fine.",
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

export const PRICING_SECTION = {
  badge: "Pricing",
  title: "Simple plans.",
  subtitle: "Start free. Upgrade when you want more depth.",
} as const

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    price: "Free",
    desc: "Follow the markets and chat with Exur.",
    cta: "Start free",
    features: [
      "Market news & headlines",
      "Exur chat",
      "BTC, ETH & Gold",
      "Community support",
      "1 seat",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49",
    desc: "For people who want faster answers and more tools.",
    cta: "Go Pro",
    featured: true,
    badge: "Popular",
    features: [
      "Unlimited chat",
      "Priority signals",
      "Paper trading",
      "Email support",
      "Up to 5 seats",
      "Saved watchlists",
    ],
  },
  {
    key: "ultimate",
    name: "Ultimate",
    price: "Custom",
    desc: "For teams that need custom limits and direct support.",
    cta: "Contact us",
    badge: "Teams",
    features: [
      "Everything in Pro",
      "Custom limits",
      "Team workspaces",
      "Dedicated support",
      "Unlimited seats",
      "Custom integrations",
    ],
  },
]

export const FOOTER_CTA = {
  title: "Your financial brain is ready.",
  subtitle:
    "Ask about your money or the markets. Get a clear answer. No dashboard required.",
  tagline: "You, your money, and the market",
} as const

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
