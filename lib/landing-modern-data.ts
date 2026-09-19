import {
  Activity,
  GraduationCap,
  Layers,
  LineChart,
  Link2,
  MoreHorizontal,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react"

export const NAV_LINKS = [
  { label: "Why Exur", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "About", id: "about" },
  { label: "Stories", id: "testimonials" },
  { label: "FAQ", id: "faq" },
  { label: "Pricing", id: "pricing" },
] as const

export const LANDING_DOT_SECTIONS = [
  { id: "top", label: "Home" },
  { id: "features", label: "Why Exur" },
  { id: "how-it-works", label: "How it works" },
  { id: "about", label: "About" },
  { id: "testimonials", label: "Stories" },
  { id: "faq", label: "FAQ" },
  { id: "pricing", label: "Pricing" },
] as const

export const HERO = {
  badge: "Your AI financial assistant",
  titleBefore: "Your money,",
  titleAfter: "handled.",
  subtitle:
    "Ask about spending, savings, and what’s next, in your own words.",
  inputPlaceholder: "Where is my money going this month?",
  socialProof: "Thousands of people already use it",
} as const

export const HERO_DEMO_EXCHANGES = [
  {
    question: "Can you watch my accounts this week?",
    answer: "Yes. I’ll ping you only if something actually needs you.",
  },
  {
    question: "Where is my money going?",
    answer: "$340/mo in unused subscriptions. Cut those first.",
  },
  {
    question: "Can I afford this apartment?",
    answer: "Not yet. Keep 6 months of rent in cash, then look.",
  },
  {
    question: "What should I do with my savings?",
    answer: "Keep 3 months in cash. Put the rest in a simple index fund.",
  },
  {
    question: "Am I overspending on dining?",
    answer: "Yes. 22% of spend. Cap it at 12% and you’re fine.",
  },
  {
    question: "Help me buy a house in 2 years.",
    answer: "Protect the down payment. Less risk, more cash, until you’re close.",
  },
  {
    question: "Is my emergency fund enough?",
    answer: "Almost. You’re at 4 months. Get to 6, then invest the rest.",
  },
  {
    question: "Should I pay the card or invest?",
    answer: "Pay the 19% card first. Then invest what’s left.",
  },
  {
    question: "Summarize my money in one line.",
    answer: "You’re fine. Save more, spend a little less, don’t chase anything.",
  },
  {
    question: "What needs my attention today?",
    answer: "Nothing urgent. I’ll tell you the moment that changes.",
  },
] as const

export const HERO_DEMO_AVATARS = [
  {
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
    initials: "AL",
  },
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
    initials: "JN",
  },
  {
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&h=96&q=80",
    initials: "MR",
  },
  {
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
    initials: "DK",
  },
  {
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80",
    initials: "SP",
  },
  {
    src: "https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=96&h=96&q=80",
    initials: "TW",
  },
  {
    src: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=96&h=96&q=80",
    initials: "NL",
  },
  {
    src: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=96&h=96&q=80",
    initials: "RK",
  },
] as const

export const HERO_VIDEO = {
  src:
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4",
  heading: "YOUR MONEY, HANDLED.",
  subtext: "Ask once. See the full picture.",
} as const

export const ABOUT_DEMO_VIDEO = {
  src:
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4",
  poster: undefined as string | undefined,
} as const

export const HERO_CHIPS = [
  { label: "Spend", icon: Wallet },
  { label: "Savings", icon: LineChart },
  { label: "Goals", icon: GraduationCap },
  { label: "Ask", icon: Sparkles },
  { label: "More", icon: MoreHorizontal },
] as const

export const TRUSTED_LOGOS = [
  { name: "Arcline", icon: Zap },
  { name: "Vault", icon: Layers },
  { name: "Northstar", icon: Sparkles },
  { name: "Ledger", icon: Link2 },
  { name: "Pulse", icon: Activity },
] as const

export const MEET_EXUR_SECTION = {
  title: "We're still early.",
  subtitle:
    "Exur is an AI financial assistant, not another chart, feed, or trading gimmick. It helps you see your money clearly, like a sharp friend who never sleeps.",
  quote: "Most people don’t need more data. They need someone paying attention.",
  tagline: "That’s what we’re building.",
} as const

export const ARCHITECTURE_SECTION = {
  title: "What Exur does",
  subtitle: "It watches. It explains. It helps when you ask.",
  cta: "Try Exur free",
} as const

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "See",
    headline: "Where your money is",
    desc: "Accounts, spending, and savings in one view.",
  },
  {
    step: "02",
    title: "Ask",
    headline: "In plain language",
    desc: "What happened, and whether it actually affects you.",
  },
  {
    step: "03",
    title: "Decide",
    headline: "What to do next",
    desc: "If there’s a move worth making, Exur says so. If not, it says wait.",
  },
] as const

export const COMPANION_SECTION = {
  title: "People actually ask this.",
  subtitle: "Real money questions. Short answers.",
} as const

export const FAQ_SECTION = {
  title: "Frequently asked questions",
  subtitle: "What Exur is and what it isn’t.",
} as const

export type FaqItem = {
  id: string
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what",
    question: "What is Exur?",
    answer:
      "Exur is an AI financial assistant. Ask about spending, savings, and what’s next, in your own words.",
  },
  {
    id: "news",
    question: "Does it need my accounts?",
    answer:
      "You can start with questions. Connect accounts when you want answers grounded in your real money.",
  },
  {
    id: "chatbot",
    question: "Is this a generic chatbot?",
    answer:
      "No. Exur is built for personal finance with your context, not open-ended chat.",
  },
  {
    id: "ask",
    question: "What can I ask?",
    answer:
      "Where money is going, what to cut, whether you can afford something, and what to do next.",
  },
  {
    id: "account",
    question: "Do I need an account?",
    answer:
      "Not to look around. Sign in to save history and get a co-pilot that remembers you.",
  },
  {
    id: "free",
    question: "How do Free and Plus differ?",
    answer:
      "Free lets you start. Plus raises limits if you use Exur every day.",
  },
  {
    id: "profits",
    question: "Is this financial advice?",
    answer:
      "No. Exur helps you see tradeoffs clearly. It is not a broker, and it does not promise returns.",
  },
]

export type VoiceExchange = {
  question: string
  answer: string
}

export const VOICE_EXCHANGES: VoiceExchange[] = [
  {
    question: "Can you watch my portfolio and only tell me when something's wrong?",
    answer:
      "Yeah. I'll keep an eye on it and message you when there's something you actually need to decide.",
  },
  {
    question: "I want to buy a house next year.",
    answer:
      "Then protect the down payment first. Keep more cash, take less risk, until you’re closer.",
  },
  {
    question: "What should I do right now?",
    answer: "Nothing for now. You're fine. I'll let you know if that changes.",
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
  title: "Simple plans.",
  subtitle: "Start free. Upgrade if you want more.",
} as const

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    price: "Free",
    desc: "See your money. Ask anything.",
    cta: "Start free",
    features: [
      "Spending & savings snapshot",
      "Exur chat",
      "Goals in plain language",
      "Community support",
      "1 seat",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49",
    desc: "For people who want faster answers and more room.",
    cta: "Go Pro",
    featured: true,
    badge: "Popular",
    features: [
      "Unlimited chat",
      "Priority answers",
      "Saved goals",
      "Email support",
      "Up to 5 seats",
      "Account history",
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
  title: "Give it a try.",
  subtitle: "Ask about your money. See if it clicks.",
  tagline: "Exur",
} as const

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return

  el.scrollIntoView({ behavior: "smooth", block: "start" })
}
