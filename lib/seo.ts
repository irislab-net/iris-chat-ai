import { routing } from "@/i18n/routing"
import { MARKETING_ORIGIN } from "@/lib/hosts"
import { SOCIAL_TELEGRAM_URL, SOCIAL_X_URL } from "@/lib/site"

export const SITE_NAME = "Exur"
export const SITE_SHORT_NAME = "Exur"

/**
 * Marketing SEO origin (metadataBase, sitemap, canonicals).
 * Chat desk (`chat.exur.ai`) is a separate indexable host with its own canonical.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_MARKETING_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  MARKETING_ORIGIN
).replace(/\/$/, "")

export const SITE_TITLE = "Exur: AI Financial Assistant"
export const SITE_TITLE_TEMPLATE = "%s · Exur"

export const SITE_DESCRIPTION =
  "Exur is your AI financial assistant. See where your money is going, ask in plain language, and get a clear next step, not another feed."

export const AI_SIGNALS_PATH = "/ai-trading-signals"
export const AI_SIGNALS_TITLE = "Your AI financial assistant"
export const AI_SIGNALS_DESCRIPTION =
  "Exur helps you see spending, savings, and tradeoffs in one place. Ask questions grounded in your money. Decision support, not a broker, not a promise of profit."

export const SITE_KEYWORDS = [
  "Exur",
  "AI financial assistant",
  "personal finance AI",
  "money assistant",
  "spending insights",
  "savings plan",
  "financial co-pilot",
  "ask about your money",
] as const

export const SOCIAL_LINKS = {
  x: SOCIAL_X_URL,
  telegram: SOCIAL_TELEGRAM_URL,
} as const

/** Default brand mark for sitemap / metadata (light theme SVG). */
export const EXUR_LOGO_MARK = "/exur-logo-light.svg"

/** Square mark for Google Search / Knowledge Panel (min 112×112). */
export const ORGANIZATION_LOGO = {
  path: "/organization-logo.png",
  width: 512,
  height: 512,
  caption: "Exur",
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
  "AI financial assistant in plain language",
  "See where your money is going",
  "Spending, savings, and goals in one view",
  "Exur co-pilot chat for signed-in users",
  "Clear next steps, not another feed",
] as const

export const AI_SIGNALS_FAQS = [
  {
    question: "What is Exur?",
    answer:
      "Exur is an AI financial assistant. Ask about spending, savings, and what’s next, in your own words.",
  },
  {
    question: "Is Exur a trading-signal tool?",
    answer:
      "No. Exur is built to help you understand your money and the tradeoffs in front of you. It is decision support, not a broker.",
  },
  {
    question: "Does Exur move my money?",
    answer:
      "No. Exur does not execute trades or move funds. You stay in control.",
  },
  {
    question: "Is Exur free to use?",
    answer:
      "You can start without paying. Connect an account for a co-pilot that remembers you.",
  },
  {
    question: "Does Exur guarantee returns?",
    answer:
      "No. Insights help you see clearly. Nothing on Exur promises profit or guaranteed accuracy.",
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
    images: ["/home-bg-header.webp", EXUR_LOGO_MARK, "/opengraph-image"] as const,
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
  {
    path: "/refund",
    changeFrequency: "monthly" as const,
    priority: 0.5,
    images: [] as const,
  },
] as const

export function buildSitemapEntries(lastModified = new Date()) {
  function localizedUrl(locale: string, path: string) {
    if (locale === "en") return absoluteUrl(path)
    if (path === "/") return absoluteUrl(`/${locale}`)
    return absoluteUrl(`/${locale}${path}`)
  }

  return INDEXABLE_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        ...Object.fromEntries(
          routing.locales.map((locale) => [
            locale,
            localizedUrl(locale, route.path),
          ])
        ),
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
    alternateName: ["Exur AI", "exur.ai"],
    url: SITE_URL,
    logo,
    image: logo,
    description: SITE_DESCRIPTION,
    sameAs: [SOCIAL_LINKS.x, SOCIAL_LINKS.telegram],
    knowsAbout: [
      "AI financial assistant",
      "personal finance",
      "spending insights",
      "savings goals",
    ],
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Exur", "exur.ai"],
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
    applicationSubCategory: "AI financial assistant",
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
    `${SITE_NAME} is an AI financial assistant at ${SITE_URL}.`,
    "",
    "## Pages",
    "",
    `- Landing: ${absoluteUrl("/")}`,
    `- Chat app (Launch App): https://chat.exur.ai/`,
    `- AI financial assistant: ${absoluteUrl(AI_SIGNALS_PATH)}`,
    `- About: ${absoluteUrl("/about")}`,
    `- Terms: ${absoluteUrl("/terms")}`,
    `- Privacy: ${absoluteUrl("/privacy")}`,
    `- Refund: ${absoluteUrl("/refund")}`,
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
