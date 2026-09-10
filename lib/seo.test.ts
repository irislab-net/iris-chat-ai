import { describe, expect, it } from "vitest"

import { PUBLIC_INDEXABLE_PATHS } from "@/lib/site"
import {
  AI_CRAWLER_USER_AGENTS,
  AI_SIGNALS_FAQS,
  AI_SIGNALS_PATH,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_TITLE,
  buildSitemapEntries,
  faqPageJsonLd,
  INDEXABLE_ROUTES,
  llmsTxt,
  ORGANIZATION_LOGO,
  organizationJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo"

describe("search / AI citation identity", () => {
  it("names the product in the language people search", () => {
    expect(SITE_TITLE.toLowerCase()).toContain("ai trading signals")
    expect(SITE_DESCRIPTION.toLowerCase()).toContain("ai trading-signal")
    expect(SITE_DESCRIPTION.toLowerCase()).toContain("crypto")
    expect(SITE_KEYWORDS).toContain("AI trading signal tool")
  })

  it("does not promise profits in public metadata", () => {
    expect(SITE_DESCRIPTION.toLowerCase()).toContain("not guaranteed profits")
  })

  it("indexes the AI trading-signals page in sitemap IA", () => {
    expect(INDEXABLE_ROUTES.map((route) => route.path)).toEqual([
      ...PUBLIC_INDEXABLE_PATHS,
    ])
    expect(PUBLIC_INDEXABLE_PATHS).toContain(AI_SIGNALS_PATH)
    expect(
      buildSitemapEntries().some((entry) =>
        entry.url.endsWith(AI_SIGNALS_PATH)
      )
    ).toBe(true)
  })

  it("keeps FAQ schema text identical to the published Q&A list", () => {
    const jsonLd = faqPageJsonLd()
    expect(jsonLd["@type"]).toBe("FAQPage")
    expect(jsonLd.mainEntity).toHaveLength(AI_SIGNALS_FAQS.length)
    for (const [index, faq] of AI_SIGNALS_FAQS.entries()) {
      expect(jsonLd.mainEntity[index]?.name).toBe(faq.question)
      expect(jsonLd.mainEntity[index]?.acceptedAnswer.text).toBe(faq.answer)
    }
  })

  it("describes a finance web app with an AI trading-signals category", () => {
    const app = webApplicationJsonLd()
    expect(app["@type"]).toEqual(["WebApplication", "SoftwareApplication"])
    expect(app.applicationSubCategory).toBe("AI trading signals")
    expect(app.isAccessibleForFree).toBe(true)
  })

  it("declares a square organization logo large enough for Google", () => {
    const org = organizationJsonLd()
    expect(ORGANIZATION_LOGO.width).toBeGreaterThanOrEqual(112)
    expect(ORGANIZATION_LOGO.height).toBe(ORGANIZATION_LOGO.width)
    expect(org.logo).toMatchObject({
      "@type": "ImageObject",
      width: ORGANIZATION_LOGO.width,
      height: ORGANIZATION_LOGO.height,
      caption: "IRIS Lab",
    })
    expect(String(org.logo.url)).toContain(ORGANIZATION_LOGO.path)
  })

  it("allows major AI search crawlers and publishes llms.txt copy", () => {
    expect(AI_CRAWLER_USER_AGENTS).toContain("OAI-SearchBot")
    expect(AI_CRAWLER_USER_AGENTS).toContain("PerplexityBot")
    expect(AI_CRAWLER_USER_AGENTS).toContain("GPTBot")
    const txt = llmsTxt()
    expect(txt).toContain(AI_SIGNALS_PATH)
    expect(txt.toLowerCase()).toContain("ai trading-signal")
  })
})
