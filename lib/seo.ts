export const SITE_NAME = "IRIS Lab"
export const SITE_SHORT_NAME = "IRIS"
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://intel.irislab.info"

export const SITE_TITLE = "IRIS Lab — AI Trading Signals & Crypto Market Co-Pilot"
export const SITE_TITLE_TEMPLATE = "%s · IRIS Lab"

export const SITE_DESCRIPTION =
  "IRIS Lab is an AI trading-signal and market-intelligence co-pilot for crypto. Read ETH pulse, model context, news analytics, and Trade Desk guidance — analysis tools, not guaranteed profits."

export const AI_SIGNALS_PATH = "/ai-trading-signals"
export const AI_SIGNALS_TITLE = "AI Trading Signals for Crypto"
export const AI_SIGNALS_DESCRIPTION =
  "IRIS Lab is an AI crypto trading-signal tool: public market pulse, model boards, news analytics, and an IRIS co-pilot. Decision support for traders — not a broker and not a promise of profit."

export const SITE_KEYWORDS = [
  "IRIS Lab",
  "AI trading signals",
  "AI trading signal tool",
  "crypto trading signals",
  "AI crypto trading",
  "ETH signals",
  "crypto market intelligence",
  "AI trading co-pilot",
  "market pulse",
  "Trade Desk",
] as const

export const SOCIAL_LINKS = {
  x: "https://x.com/TheIrisLab",
  telegram: "https://t.me/theIrisLab",
} as const

/** Square mark for Google Search / Knowledge Panel (min 112×112). UI still uses /Logo.png. */
export const ORGANIZATION_LOGO = {
  path: "/organization-logo.png",
  width: 512,
  height: 512,
  caption: "IRIS Lab",
} as const

/** Live-retrieval and training crawlers that should see public pages. */
export const AI_CRAWLER_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "CCBot",
] as const

export const PRODUCT_FEATURE_LIST = [
  "AI trading signals and market pulse for crypto",
  "ETH insight and model-board context",
  "Crypto news analytics (distilled headlines, not a raw wire)",
  "IRIS AI co-pilot chat for signed-in users",
  "Paper-trading practice desk",
] as const

export const AI_SIGNALS_FAQS = [
  {
    question: "What is IRIS Lab?",
    answer:
      "IRIS Lab is an AI market-intelligence desk and trading-signal co-pilot for cryptocurrency. The public homepage shows market pulse, model context, and news bullets. Signed-in users can talk to the IRIS co-pilot in plain language.",
  },
  {
    question: "Is IRIS Lab an AI trading signal tool?",
    answer:
      "Yes. IRIS Lab is an AI trading-signal tool for crypto: it organizes stance, model context, and Trade Desk guidance for the candle you are looking at. It is decision support for analysis, not a substitute for your own judgment.",
  },
  {
    question: "Does IRIS Lab execute live trades?",
    answer:
      "No. This site does not execute brokerage orders. Paper trading is a practice desk. Turn-by-turn Trade Desk guidance is product direction, not live order execution here.",
  },
  {
    question: "Is IRIS Lab free to use?",
    answer:
      "The public market-intelligence homepage is available without an account. Co-pilot chat and member tools require connecting an account.",
  },
  {
    question: "Does IRIS Lab guarantee trading profits?",
    answer:
      "No. Insights and co-pilot replies are tools for analysis. Nothing on IRIS Lab promises profit, risk-free trades, or guaranteed accuracy.",
  },
] as const

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path
  if (path === "/") return SITE_URL
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

/** Public, indexable routes for sitemap.xml (never include /auth/*). */
export const INDEXABLE_ROUTES = [
  {
    path: "/",
    changeFrequency: "weekly" as const,
    priority: 1,
    images: ["/home-bg-header.webp", "/Logo.png", "/opengraph-image"] as const,
  },
  {
    path: "/app",
    changeFrequency: "hourly" as const,
    priority: 0.95,
    images: [ORGANIZATION_LOGO.path, "/Logo.png"] as const,
  },
  {
    path: "/about",
    changeFrequency: "monthly" as const,
    priority: 0.7,
    images: [] as const,
  },
  {
    path: AI_SIGNALS_PATH,
    changeFrequency: "weekly" as const,
    priority: 0.9,
    images: [] as const,
  },
  {
    path: "/privacy",
    changeFrequency: "monthly" as const,
    priority: 0.5,
    images: [] as const,
  },
  {
    path: "/terms",
    changeFrequency: "monthly" as const,
    priority: 0.5,
    images: [] as const,
  },
] as const

export function buildSitemapEntries(lastModified = new Date()) {
  function localizedUrl(locale: string, path: string) {
    if (locale === "en") return absoluteUrl(path)
    if (path === "/") return absoluteUrl("/ar")
    return absoluteUrl(`/ar${path}`)
  }

  return INDEXABLE_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        en: localizedUrl("en", route.path),
        ar: localizedUrl("ar", route.path),
        "x-default": localizedUrl("en", route.path),
      },
    },
    ...(route.images.length > 0
      ? { images: route.images.map((image) => absoluteUrl(image)) }
      : {}),
  }))
}

export function organizationLogoJsonLd() {
  const url = absoluteUrl(ORGANIZATION_LOGO.path)
  return {
    "@type": "ImageObject",
    url,
    contentUrl: url,
    width: ORGANIZATION_LOGO.width,
    height: ORGANIZATION_LOGO.height,
    caption: ORGANIZATION_LOGO.caption,
  }
}

export function organizationJsonLd() {
  const logo = organizationLogoJsonLd()
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: ["IRIS", "IRIS Intel", "IRIS Lab AI"],
    url: SITE_URL,
    logo,
    image: logo,
    description: SITE_DESCRIPTION,
    sameAs: [SOCIAL_LINKS.x, SOCIAL_LINKS.telegram],
    knowsAbout: [
      "AI trading signals",
      "cryptocurrency",
      "market intelligence",
      "Ethereum",
    ],
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["IRIS", "intel.irislab.info"],
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: organizationLogoJsonLd(),
    },
    inLanguage: "en",
  }
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["WebApplication", "SoftwareApplication"],
    name: SITE_NAME,
    alternateName: SITE_TITLE,
    url: SITE_URL,
    applicationCategory: "FinanceApplication",
    applicationSubCategory: "AI trading signals",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    description: SITE_DESCRIPTION,
    featureList: [...PRODUCT_FEATURE_LIST],
    isAccessibleForFree: true,
    inLanguage: "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: organizationLogoJsonLd(),
    },
    image: organizationLogoJsonLd(),
  }
}

export function faqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: AI_SIGNALS_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export function llmsTxt() {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} (also called IRIS or IRIS Intel) is an AI trading-signal and crypto market-intelligence co-pilot at ${SITE_URL}.`,
    "",
    "## Pages",
    "",
    `- Landing: ${SITE_URL}/`,
    `- Market desk (Launch App): ${absoluteUrl("/app")}`,
    `- AI trading signals: ${absoluteUrl(AI_SIGNALS_PATH)}`,
    `- About: ${absoluteUrl("/about")}`,
    `- Terms: ${absoluteUrl("/terms")}`,
    `- Privacy: ${absoluteUrl("/privacy")}`,
    "",
    "## Product",
    "",
    ...PRODUCT_FEATURE_LIST.map((feature) => `- ${feature}`),
    "",
    "## Facts",
    "",
    ...AI_SIGNALS_FAQS.map((faq) => `- ${faq.question} ${faq.answer}`),
    "",
    "## Contact",
    "",
    `- X: ${SOCIAL_LINKS.x}`,
    `- Telegram: ${SOCIAL_LINKS.telegram}`,
    "",
  ]
  return lines.join("\n")
}
