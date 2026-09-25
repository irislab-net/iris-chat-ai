import { describe, expect, it } from "vitest"

import { PUBLIC_INDEXABLE_PATHS } from "@/lib/site"
import {
  AI_CRAWLER_USER_AGENTS,
  AI_SIGNALS_FAQS,
  AI_SIGNALS_PATH,
  EXUR_DEFINITION,
  EXUR_IS_NOT,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_TITLE,
  SITE_URL,
  WHAT_IS_EXUR_PATH,
  buildSitemapEntries,
  faqPageJsonLd,
  INDEXABLE_ROUTES,
  llmsTxt,
  ORGANIZATION_LOGO,
  organizationJsonLd,
  webApplicationJsonLd,
  whatIsExurJsonLd,
} from "@/lib/seo"

describe("search / AI citation identity", () => {
  it("keeps marketing SITE_URL off the chat desk host", () => {
    expect(SITE_URL).toBe("https://exur.ai")
    expect(SITE_URL).not.toContain("chat.exur.ai")
  })

  it("names the product in the language people search", () => {
    expect(SITE_TITLE.toLowerCase()).toContain("ai financial assistant")
    expect(SITE_DESCRIPTION.toLowerCase()).toContain("ai financial assistant")
    expect(SITE_DESCRIPTION.toLowerCase()).not.toContain("crypto")
    expect(SITE_KEYWORDS).toContain("AI financial assistant")
    expect(SITE_KEYWORDS).toContain("what is Exur")
  })

  it("does not promise profits in public metadata", () => {
    expect(SITE_DESCRIPTION.toLowerCase()).not.toContain("guaranteed profit")
    expect(EXUR_DEFINITION.toLowerCase()).not.toContain("guaranteed")
    expect(
      EXUR_IS_NOT.some((line) => line.toLowerCase().includes("profit"))
    ).toBe(true)
  })

  it("indexes the citation and AI trading-signals pages in sitemap IA", () => {
    expect(INDEXABLE_ROUTES.map((route) => route.path)).toEqual([
      ...PUBLIC_INDEXABLE_PATHS,
    ])
    expect(PUBLIC_INDEXABLE_PATHS).toContain(WHAT_IS_EXUR_PATH)
    expect(PUBLIC_INDEXABLE_PATHS).toContain(AI_SIGNALS_PATH)
    const urls = buildSitemapEntries().map((entry) => entry.url)
    expect(urls.some((url) => url.endsWith(WHAT_IS_EXUR_PATH))).toBe(true)
    expect(urls.some((url) => url.endsWith(AI_SIGNALS_PATH))).toBe(true)
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

  it("publishes a citation graph for What is Exur", () => {
    const graph = whatIsExurJsonLd()
    expect(graph["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "WebPage" }),
        expect.objectContaining({
          "@type": "DefinedTerm",
          name: "Exur",
          description: EXUR_DEFINITION,
        }),
        expect.objectContaining({ "@type": "FAQPage" }),
      ])
    )
  })

  it("describes a finance web app with an AI assistant category", () => {
    const app = webApplicationJsonLd()
    expect(app["@type"]).toEqual(["WebApplication", "SoftwareApplication"])
    expect(app.applicationSubCategory).toBe("AI financial assistant")
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
      caption: "Exur",
    })
    expect(String(org.logo.url)).toContain(ORGANIZATION_LOGO.path)
  })

  it("allows major AI search crawlers and publishes llms.txt copy", () => {
    expect(AI_CRAWLER_USER_AGENTS).toContain("OAI-SearchBot")
    expect(AI_CRAWLER_USER_AGENTS).toContain("PerplexityBot")
    expect(AI_CRAWLER_USER_AGENTS).toContain("GPTBot")
    const txt = llmsTxt()
    expect(txt).toContain(WHAT_IS_EXUR_PATH)
    expect(txt).toContain(AI_SIGNALS_PATH)
    expect(txt).toContain("/security")
    expect(txt).toContain(EXUR_DEFINITION)
    expect(txt.toLowerCase()).toContain("ai financial assistant")
    expect(txt.toLowerCase()).toContain("citation")
    expect(txt.toLowerCase()).toContain("soc 2")
    expect(txt.toLowerCase()).toContain("iso 27001")
    expect(txt.toLowerCase()).toContain("bug bounty")
    expect(txt.toLowerCase()).not.toContain("guaranteed profit")
  })
})
