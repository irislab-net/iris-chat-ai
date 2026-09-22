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
  { label: "Desk", id: "desk" },
  { label: "Signals", id: "signals" },
  { label: "About", id: "about" },
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
  { id: "desk", label: "The desk" },
  { id: "signal-wait", label: "Signal or wait" },
  { id: "signals", label: "Signals" },
  { id: "about", label: "About" },
  // { id: "testimonials", label: "Reviews" },
  { id: "try", label: "Try free" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "get-started", label: "Get started" },
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

/** Copy is deliberately thin. The orb narration carries this section. */
export const MEET_EXUR_SECTION = {
  title: "Let Exur explain.",
  subtitle: "A minute, in its own words.",
} as const

export const ARCHITECTURE_SECTION = {
  title: "How the desk works.",
  subtitle: "Read the tape. Ask once. Then act, or wait.",
} as const

/** Live desks vs. upcoming tokens for the signals coverage band. */
export const SIGNALS_MARKETS_SECTION = {
  title: "Deep data where it counts.",
  subtitle: "BTC, ETH, and gold are live. More desks soon.",
  soonLabel: "Soon",
  soonHint: "More desks rolling out soon",
  cardAction: "Get signal",
} as const

export const SIGNALS_LIVE_MARKETS = [
  { id: "btc", symbol: "BTC", name: "Bitcoin" },
  { id: "eth", symbol: "ETH", name: "Ethereum" },
  { id: "xau", symbol: "XAU", name: "Gold" },
] as const

export const SIGNALS_SOON_MARKETS = [
  { id: "sol", symbol: "SOL", name: "Solana" },
  { id: "bnb", symbol: "BNB", name: "BNB" },
  { id: "xrp", symbol: "XRP", name: "XRP" },
  { id: "link", symbol: "LINK", name: "Chainlink" },
  { id: "avax", symbol: "AVAX", name: "Avalanche" },
  { id: "doge", symbol: "DOGE", name: "Dogecoin" },
  { id: "arb", symbol: "ARB", name: "Arbitrum" },
  { id: "op", symbol: "OP", name: "Optimism" },
] as const

export const DESK_SECTION = {
  title: "From headline to answer.",
  subtitle: "No feed to scroll. Just the story worth a question.",
} as const

export const DESK_NEWS_ITEMS = [
  {
    source: "Bloomberg",
    time: "3m",
    impact: 92,
    tone: "up" as const,
    headline: "Spot ETF flows turn positive after three weeks of outflows",
  },
  {
    source: "CoinDesk",
    time: "12m",
    impact: 78,
    tone: "down" as const,
    headline: "Funding flips negative as leverage resets ahead of CPI",
  },
  {
    source: "The Block",
    time: "27m",
    impact: 64,
    tone: "up" as const,
    headline: "Exchange reserves drop to the lowest level since March",
  },
] as const

export const DESK_ASK = {
  question: "Does the ETF headline matter for ETH today?",
  answer:
    "Yes. Inflows usually lift beta first. Watch whether funding stays negative while spot leads.",
} as const

export const SIGNAL_WAIT_SECTION = {
  title: "Act only when it’s clear.",
  subtitle: "Ask once. Get a setup, or a quiet no.",
  composerPlaceholder: "Ask about a trade…",
} as const

/** Demo ticket for the landing signal card. Same shape as chat `ChatSignalCard`. */
export const SIGNAL_WAIT_TICKET = {
  symbol: "ETH",
  side: "LONG" as const,
  quantity: 0,
  markPrice: 3242,
  stopLoss: 3188,
  takeProfit: 3390,
  leverage: 5,
  setup: "Spot leads while funding stays soft",
  thesis: "Spot leads; funding still soft.",
  timeHorizon: "Intraday",
  entryReason: "Above session VWAP",
  stopLossReason: "Below prior swing",
  takeProfitReason: "Prior supply shelf",
}

export const SIGNAL_WAIT_TRADE_BEAT = {
  question: "Long ETH from here?",
} as const

export const SIGNAL_WAIT_HOLD = {
  label: "No trade",
  question: "Short this bounce?",
  answer: "No. Tape is mixed and leverage is still resetting.",
  reason: "No edge worth forcing today.",
} as const

export const GUEST_TRIAL_SECTION = {
  title: "Browse the desk. Ask a few times.",
  subtitle:
    "News is open without an account. Guest chat gives you three messages a week, then sign in with Google to keep going.",
  stat: "3",
  statLabel: "guest messages / week",
  cta: "Open the desk",
  note: "No wallet. No card. Just the market.",
} as const

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Read",
    headline: "Scored headlines",
    desc: "Impact-ranked news for the market you’re on, not another endless feed.",
  },
  {
    step: "02",
    title: "Ask",
    headline: "In plain language",
    desc: "Follow up on a story or the wider tape. Short answers, grounded in context.",
  },
  {
    step: "03",
    title: "Act",
    headline: "Setup or wait",
    desc: "If there’s a move worth making, Exur shows levels. If not, it says wait.",
  },
] as const

export const TESTIMONIALS_SECTION = {
  badge: "From X",
  title: "People post about it.",
  subtitle: "Unedited, straight from the timeline.",
} as const

export const FAQ_SECTION = {
  title: "Frequently asked questions.",
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
      "A market desk: scored headlines on one side, an Exur co-pilot on the other, grounded in live context, not generic chat.",
  },
  {
    id: "news",
    question: "Do I need an account to read news?",
    answer:
      "No. The news desk is open. Sign in when you want history, higher limits, and a co-pilot that remembers you.",
  },
  {
    id: "chatbot",
    question: "Is this a generic chatbot?",
    answer:
      "No. Exur answers about the market and headlines you’re looking at. Short takes, not endless chat.",
  },
  {
    id: "ask",
    question: "What can I ask?",
    answer:
      "Whether a headline matters, what the tape is saying, levels to watch, or whether there’s a setup worth taking.",
  },
  {
    id: "account",
    question: "What’s the guest trial?",
    answer:
      "Three free chat messages a week without signing in. Browse news anytime. Google sign-in unlocks the rest.",
  },
  {
    id: "free",
    question: "How do Free and Plus differ?",
    answer:
      "Free covers the desk with daily caps. Plus raises limits when Exur is part of your routine.",
  },
  {
    id: "profits",
    question: "Is this financial advice?",
    answer:
      "No. Exur helps you read the tape clearly. It is not a broker, and it does not promise returns.",
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
  /** Struck-through compare-at price (landing only). */
  priceWas?: string
  desc: string
  cta: string
  features: string[]
  featured?: boolean
  badge?: string
}

export const PRICING_SECTION = {
  title: "Pick your depth.",
  subtitle: "Free to browse news. Plus when Exur is part of your routine.",
} as const

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "free",
    name: "Free",
    price: "Free",
    desc: "Browse news. Co-pilot on a daily cap.",
    cta: "Start free",
    features: [
      "Scored market headlines",
      "Guest chat, 3 messages / week",
      "Daily co-pilot send limit",
      "BTC, ETH, and gold desks",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    price: "$19",
    priceWas: "$49",
    desc: "When the desk is part of every session.",
    cta: "Go Plus",
    featured: true,
    badge: "Most chosen",
    features: [
      "Everything in Free",
      "Higher daily and weekly limits",
      "Saved chat history",
      "Deeper signal and planning context",
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
      "Direct line. We set it up",
    ],
  },
]

/**
 * Footer blurb. Deliberately not `SITE_DESCRIPTION`. That string is tuned for
 * search results and repeats the hero subtitle almost word for word.
 */
export const FOOTER_TAGLINE = "News and Exur for the market you follow."

/** Closing CTA band. The page's last ask, just before the FAQ. */
export const CTA_SECTION = {
  title: "Stop guessing the tape.",
  subtitle: "One question on a live headline is enough to tell if this fits you.",
  cta: "Open the desk",
  note: "News is free. Guest chat included. No wallet to look around.",
} as const
