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
  // { label: "Reviews", id: "testimonials" },
  { label: "FAQ", id: "faq" },
  { label: "Pricing", id: "pricing" },
] as const

/**
 * Scroll-spy targets, in document order.
 *
 * Every id here must resolve to a real element that occupies its own band of
 * the page — `#top` is the page root and would stay "entered" forever, so the
 * hero is tracked via `#hero` instead. Sections that are not nav destinations
 * (the CTA band) still belong here: without them the previous section stays
 * highlighted while they are on screen.
 */
export const LANDING_SCROLL_SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "features", label: "Why Exur" },
  { id: "how-it-works", label: "How it works" },
  { id: "about", label: "About" },
  // { id: "testimonials", label: "Reviews" },
  { id: "get-started", label: "Get started" },
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
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80",
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

/** Copy is deliberately thin — the orb narration carries this section. */
export const MEET_EXUR_SECTION = {
  title: "Let Exur explain.",
  subtitle: "A minute, in its own words.",
} as const

export const ARCHITECTURE_SECTION = {
  title: "How it works",
  subtitle: "Three steps. After that it’s just a conversation.",
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

export const TESTIMONIALS_SECTION = {
  badge: "From X",
  title: "People post about it.",
  subtitle: "Unedited, straight from the timeline.",
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
      "An assistant that reads your accounts and answers in plain language — grounded in your actual numbers, not generic advice.",
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

export type XPost = {
  id: string
  name: string
  /** Without the leading “@”. */
  handle: string
  avatar: string
  initials: string
  text: string
  /** Short display date, e.g. “Mar 12”. */
  date: string
  /** Permalink to the original post — every card links out so claims stay checkable. */
  url: string
}

/**
 * PLACEHOLDER POSTS — replace with real ones before launch.
 *
 * Copy each field straight from the original post and keep `url` pointing at it.
 * Use the poster's real X avatar URL (`avatar`) rather than a stock photo, and
 * leave `text` as written — light edits are what make quote cards read as fake.
 */
export const X_POSTS: XPost[] = [
  {
    id: "1",
    name: "Maya Ruiz",
    handle: "mayabuilds",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80",
    initials: "MR",
    text: "connected my accounts to @exur on a sunday. by monday it found two subscriptions i forgot existed + a card fee i'd been paying for three years.\n\ndidn't lecture me about budgeting. just told me what to cancel. $284/mo gone.",
    date: "Mar 12",
    url: "https://x.com/exur_ai",
  },
  {
    id: "2",
    name: "Jonas Neumann",
    handle: "jonasdev",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80",
    initials: "JN",
    text: "freelance income is lumpy and every budgeting app i've tried breaks on that.\n\nexur is the first one that got it and told me how much i could actually take out this month without wrecking my runway.",
    date: "Mar 8",
    url: "https://x.com/exur_ai",
  },
  {
    id: "3",
    name: "Priya Shah",
    handle: "priyashah",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80",
    initials: "PS",
    text: "asked it if i could afford a car. it said not yet, and showed me exactly why.\n\nhonestly i'd rather hear that than a yes i'd regret.",
    date: "Feb 27",
    url: "https://x.com/exur_ai",
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
  subtitle: "Start free. Upgrade if you hit the daily limit.",
} as const

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "free",
    name: "Free",
    price: "Free",
    desc: "Look around. Ask a few things. No signup.",
    cta: "Start free",
    features: [
      "Ask in your own words",
      "No account required to try",
      "Daily ask limit",
      "Connect accounts when you want",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    price: "$49",
    desc: "If you use it every day, this is the room you need.",
    cta: "Go Plus",
    featured: true,
    badge: "Popular",
    features: [
      "Everything in Free",
      "Higher daily and weekly limits",
      "Saved chat history",
      "A co-pilot that remembers you",
    ],
  },
  {
    key: "ultimate",
    name: "Ultimate",
    price: "Custom",
    desc: "When Plus limits still aren’t enough.",
    cta: "Contact us",
    badge: "Custom",
    features: [
      "Everything in Plus",
      "Limits we set with you",
      "Direct line — we set it up",
    ],
  },
]

/**
 * Footer blurb. Deliberately not `SITE_DESCRIPTION` — that string is tuned for
 * search results and repeats the hero subtitle almost word for word.
 */
export const FOOTER_TAGLINE = "The financial brain behind your accounts."

/** Closing CTA band — the page's last ask, just before the FAQ. */
export const CTA_SECTION = {
  title: "Stop guessing about money.",
  subtitle: "One question is enough to tell whether this is useful to you.",
  cta: "Start free",
  note: "Free to start. No signup to look around.",
} as const
