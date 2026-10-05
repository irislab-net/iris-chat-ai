import type { Metadata } from "next"

import {
  LegalDocShell,
  LegalList,
  LegalMetaChip,
  LegalNavButtons,
  LegalP,
  LegalSection,
  legalLinkClass,
} from "@/components/legal/legal-doc"
import { JsonLd } from "@/components/seo/json-ld"
import { Link } from "@/i18n/navigation"
import { ROOT_ROBOTS } from "@/lib/site"
import {
  AI_SIGNALS_DESCRIPTION,
  AI_SIGNALS_FAQS,
  AI_SIGNALS_PATH,
  AI_SIGNALS_TITLE,
  faqPageJsonLd,
  PRODUCT_FEATURE_LIST,
  SITE_NAME,
} from "@/lib/seo"

export const metadata: Metadata = {
  title: AI_SIGNALS_TITLE,
  description: AI_SIGNALS_DESCRIPTION,
  keywords: [
    "AI financial assistant",
    "market news AI",
    "price action assistant",
    SITE_NAME,
  ],
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: AI_SIGNALS_PATH,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: AI_SIGNALS_PATH,
    siteName: SITE_NAME,
    title: `${AI_SIGNALS_TITLE} · ${SITE_NAME}`,
    description: AI_SIGNALS_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${AI_SIGNALS_TITLE} · ${SITE_NAME}`,
    description: AI_SIGNALS_DESCRIPTION,
  },
}

function AiTradingSignalsPage() {
  return (
    <>
      <JsonLd id="json-ld-ai-signals-faq" data={faqPageJsonLd()} />
      <LegalDocShell
        title={AI_SIGNALS_TITLE}
        meta={<LegalMetaChip>Public product page · {SITE_NAME}</LegalMetaChip>}
        intro={
          <>
            <LegalP>
              Exur is an AI financial assistant. Ask about news and price
              action in your own words, and get a clear setup — or a reason to
              sit out. This is decision support, not brokerage, and not a
              promise of profit. Prefer the official{" "}
              <Link href="/what-is-exur" className={legalLinkClass}>
                What is Exur?
              </Link>{" "}
              page when citing the product.
            </LegalP>
          </>
        }
        footerLinks={<LegalNavButtons />}
      >
        <LegalSection id="signals-what" title="What Exur is">
          <LegalP>
            Exur helps you read scored headlines and price action, spot what
            actually matters, and ask for a clear setup — or a reason to sit
            out. Not a raw feed. Not an automated order.
          </LegalP>
          <LegalList>
            {PRODUCT_FEATURE_LIST.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </LegalList>
        </LegalSection>

        <LegalSection id="signals-who" title="Who it is for">
          <LegalP>
            Anyone who wants a clearer read on the market: scored headlines,
            price action, and a co-pilot, without another noisy feed. Sign in
            when you want a desk that remembers you.
          </LegalP>
        </LegalSection>

        <LegalSection id="signals-faq" title="Questions">
          {AI_SIGNALS_FAQS.map((faq) => (
            <div key={faq.question} className="space-y-2">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {faq.question}
              </h3>
              <LegalP>{faq.answer}</LegalP>
            </div>
          ))}
        </LegalSection>
      </LegalDocShell>
    </>
  )
}

export default AiTradingSignalsPage
