import type { Metadata } from "next"

import { JsonLd } from "@/components/seo/json-ld"
import {
  LegalDocShell,
  LegalList,
  LegalNavButtons,
  LegalP,
  LegalSection,
} from "@/components/legal/legal-doc"
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
    "personal finance AI",
    "money assistant",
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
        meta={<p>Public product page · {SITE_NAME}</p>}
        intro={
          <>
            <LegalP>
              Exur is an AI financial assistant. Ask about spending, savings,
              and what’s next, in your own words. This is decision support,
              not brokerage, and not a promise of profit.
            </LegalP>
          </>
        }
        footerLinks={<LegalNavButtons />}
      >
        <LegalSection id="signals-what" title="What Exur is">
          <LegalP>
            Exur helps you see where your money is going, spot what actually
            matters, and ask for a next step in plain language. Not a raw feed.
            Not an automated order.
          </LegalP>
          <LegalList>
            {PRODUCT_FEATURE_LIST.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </LegalList>
        </LegalSection>

        <LegalSection id="signals-who" title="Who it is for">
          <LegalP>
            Anyone who wants a clear read on their money: spending, savings,
            and tradeoffs, without another chart-heavy app. Sign in when you
            want a co-pilot that remembers you.
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
