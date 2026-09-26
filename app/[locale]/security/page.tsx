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
import { ROOT_ROBOTS, SITE_NAME } from "@/lib/site"
import {
  SECURITY_DEFINITION,
  SECURITY_DESCRIPTION,
  SECURITY_EMAIL,
  SECURITY_FAQS,
  SECURITY_PATH,
  SECURITY_PROGRAM,
  SECURITY_TITLE,
} from "@/lib/security"
import { absoluteUrl, SITE_URL } from "@/lib/seo"

export const metadata: Metadata = {
  title: SECURITY_TITLE,
  description: SECURITY_DESCRIPTION,
  keywords: [
    "Exur security",
    "SOC 2",
    "ISO 27001",
    "penetration testing",
    "bug bounty",
    "security audit",
  ],
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: SECURITY_PATH,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SECURITY_PATH,
    siteName: SITE_NAME,
    title: `${SECURITY_TITLE} · ${SITE_NAME}`,
    description: SECURITY_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${SECURITY_TITLE} · ${SITE_NAME}`,
    description: SECURITY_DESCRIPTION,
  },
}

function securityJsonLd() {
  const url = absoluteUrl(SECURITY_PATH)
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: SECURITY_TITLE,
        description: SECURITY_DESCRIPTION,
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
        },
        inLanguage: "en",
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: SECURITY_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  }
}

function SecurityPage() {
  return (
    <>
      <JsonLd id="json-ld-security" data={securityJsonLd()} />
      <LegalDocShell
        eyebrow="Trust · Security"
        title={SECURITY_TITLE}
        meta={
          <>
            <LegalMetaChip>SOC 2</LegalMetaChip>
            <LegalMetaChip>ISO 27001</LegalMetaChip>
            <LegalMetaChip>Bug bounty</LegalMetaChip>
          </>
        }
        intro={
          <>
            <LegalP className="text-base text-foreground sm:text-[1.05rem]">
              {SECURITY_DEFINITION}
            </LegalP>
            <LegalP>
              This page is the public summary of how Exur protects accounts,
              sessions, and data. For privacy rights and processing details, see
              the{" "}
              <Link href="/privacy" className={legalLinkClass}>
                Privacy Policy
              </Link>
              .
            </LegalP>
          </>
        }
        footerLinks={<LegalNavButtons showSecurity={false} />}
      >
        <LegalSection id="security-program" title="Security program">
          <LegalList>
            {SECURITY_PROGRAM.map((item) => (
              <li key={item.id}>
                <span className="font-medium text-foreground">
                  {item.title}.
                </span>{" "}
                {item.summary}
              </li>
            ))}
          </LegalList>
        </LegalSection>

        <LegalSection id="security-reporting" title="Report a vulnerability">
          <LegalP>
            Researchers acting in good faith are welcome. Email{" "}
            <a href={`mailto:${SECURITY_EMAIL}`} className={legalLinkClass}>
              {SECURITY_EMAIL}
            </a>{" "}
            with a clear description, impact, and steps to reproduce. Do not
            access or modify other users’ data, and do not disrupt the service.
          </LegalP>
          <LegalP>
            Valid reports through the bug bounty program are acknowledged and
            tracked to remediation. We ask for a reasonable window before public
            disclosure.
          </LegalP>
        </LegalSection>

        <LegalSection id="security-faq" title="Frequently asked questions">
          {SECURITY_FAQS.map((faq) => (
            <div key={faq.question} className="space-y-2">
              <h3 className="text-[0.9375rem] font-medium tracking-tight text-foreground sm:text-base">
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

export default SecurityPage
