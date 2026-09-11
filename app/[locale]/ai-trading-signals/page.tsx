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
    "AI trading signals",
    "AI trading signal tool",
    "crypto trading signals",
    "AI crypto trading",
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
      <JsonLd data={faqPageJsonLd()} />
      <LegalDocShell
        title={AI_SIGNALS_TITLE}
        meta={<p>Public product page · {SITE_NAME}</p>}
        intro={
          <>
            <LegalP>
              IRIS Lab is an AI trading-signal tool for crypto. The public desk
              shows market pulse, model context, and news bullets for the candle
              you select. Signed-in users can ask the IRIS co-pilot in plain
              language. This is analysis support — not brokerage execution and
              not a promise of profit.
            </LegalP>
          </>
        }
        footerLinks={<LegalNavButtons />}
      >
        <LegalSection id="signals-what" title="What the signals are">
          <LegalP>
            IRIS organizes market information into a readable stance: headline
            pulse, how models sit relative to each other, payoff shape, and
            short news bullets with source context. That package is the trading
            signal — a structured read of the current candle, not a raw feed and
            not an automated order.
          </LegalP>
          <LegalList>
            {PRODUCT_FEATURE_LIST.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </LegalList>
        </LegalSection>

        <LegalSection id="signals-who" title="Who it is for">
          <LegalP>
            Traders who want an AI co-pilot on crypto markets — especially ETH
            pulse today — without handing funds to a bot. Guests can use the
            public desk at the site root. Connecting an account unlocks
            co-pilot chat and member tools when available.
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
