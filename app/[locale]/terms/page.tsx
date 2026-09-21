import type { Metadata } from "next"

import {
  LegalDocShell,
  LegalList,
  LegalNavButtons,
  LegalP,
  LegalSection,
} from "@/components/legal/legal-doc"
import { Link } from "@/i18n/navigation"
import { LEGAL_DOCS_REPO_URL } from "@/lib/legal"
import { ROOT_ROBOTS, SITE_NAME, TERMS_DESCRIPTION } from "@/lib/site"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: TERMS_DESCRIPTION,
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/terms",
    siteName: SITE_NAME,
    title: `Terms of Service · ${SITE_NAME}`,
    description: TERMS_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `Terms of Service · ${SITE_NAME}`,
    description: TERMS_DESCRIPTION,
  },
}

function TermsPage() {
  return (
    <LegalDocShell
      title="Terms of Service"
      meta={
        <>
          <p>Effective Date: September 21, 2026</p>
          <p>Version: 2.1.0</p>
          <p>
            Scope: Exur (
            <span className="font-mono text-foreground/90">exur.ai</span>
            ), an AI-native financial intelligence platform.
          </p>
        </>
      }
      intro={
        <>
          <LegalP>
            Welcome to{" "}
            <span className="font-medium text-foreground">Exur</span>{" "}
            (accessible via{" "}
            <span className="font-mono text-foreground/90">exur.ai</span>
            ). These Terms of Service (“Terms”) govern your access to and use of
            our website, conversational AI interfaces, Model Context Protocol
            (MCP) data pipelines, market intelligence tools, quantitative
            prediction models, and associated services (collectively, the
            “Service”).
          </LegalP>
          <LegalP>
            The Service is operated and maintained by the{" "}
            <span className="font-medium text-foreground">Exur Core Team</span>{" "}
            (pending formal corporate entity incorporation in a designated
            jurisdiction). By accessing or using the Service, you agree to be
            bound by these Terms.
          </LegalP>
        </>
      }
      footerLinks={<LegalNavButtons showTerms={false} />}
    >
      <LegalSection
        id="terms-disclaimer"
        title="1. Financial & Investment Disclaimer (No Advice)"
      >
        <LegalP className="font-semibold uppercase text-foreground">
          The Service does not provide financial, investment, legal, or tax
          advice.
        </LegalP>
        <LegalList>
          <li>
            All content, conversational outputs, quantitative model signals,
            market analysis, news summaries, confidence metrics, and AI-generated
            insights provided by Exur are strictly for{" "}
            <span className="font-medium text-foreground">
              informational, educational, and research purposes only
            </span>
            .
          </li>
          <li>
            Exur is not a registered investment advisor, broker-dealer,
            financial planner, commodities trading advisor, or regulated
            financial institution under any jurisdiction.
          </li>
          <li>
            Trading and investing in financial instruments, digital assets,
            cryptocurrencies, and derivatives involve substantial risk of
            financial loss and are not suitable for every individual. You bear
            sole responsibility for your investment decisions, risk management,
            and trading activities. Exur and its operators shall not be held
            liable for any direct or indirect financial losses resulting from
            your reliance on information or signals provided by the Service.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="terms-eligibility"
        title="2. Eligibility & Prohibited Jurisdictions"
      >
        <LegalP>
          By accessing or using the Service, you represent and warrant that:
        </LegalP>
        <LegalList>
          <li>
            You are at least{" "}
            <span className="font-medium text-foreground">
              18 years of age
            </span>{" "}
            (or the age of legal majority in your jurisdiction).
          </li>
          <li>
            You are not located in, a citizen of, or a resident of any country
            or territory subject to comprehensive financial sanctions or trade
            embargoes administered by OFAC, the European Union, the United
            Nations, or other applicable regulatory bodies.
          </li>
          <li>
            You are complying with all applicable local, national, and
            international laws regarding digital asset access and automated
            analytics tools.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="terms-accounts"
        title="3. User Accounts and Authentication (Google OAuth)"
      >
        <LegalP>
          To access the Service, you must authenticate using your{" "}
          <span className="font-medium text-foreground">Google account</span>{" "}
          via Google OAuth. You agree that:
        </LegalP>
        <LegalList>
          <li>
            You are responsible for maintaining the security and confidentiality
            of your Google account credentials.
          </li>
          <li>
            We collect essential account profile details (Google User ID, email
            address, name, and profile picture URL) to manage your session and
            personalize your user experience.
          </li>
          <li>
            You agree not to attempt to breach, bypass, reverse-engineer, or
            exploit our authentication mechanisms, API routes, or backend
            systems.
          </li>
          <li>
            We reserve the right to suspend or terminate your access to the
            Service at our sole discretion if you violate these Terms or engage
            in fraudulent or abusive activities.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="terms-usage"
        title="4. Platform Usage & AI Model Interactions"
      >
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              AI Reasoning &amp; Conversational Limitations:
            </span>{" "}
            Exur utilizes third-party Large Language Model (LLM) orchestration
            (via OpenRouter, OpenAI, and Google Gemini) combined with
            proprietary prediction engines. You acknowledge that AI outputs can
            occasionally produce inaccurate, incomplete, or delayed information
            (“hallucinations”).
          </li>
          <li>
            <span className="font-medium text-foreground">
              Fair Usage &amp; System Abuse:
            </span>{" "}
            You agree not to perform automated scraping, reverse engineering,
            rate-limit bypassing, or unauthorized exploitation of Exur’s MCP
            tools, backend APIs, or prediction models.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="terms-availability"
        title="5. Service Availability, Modifications & Free/Pro Tiers"
      >
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              “As-Is” Service Provision:
            </span>{" "}
            The Service is provided on an{" "}
            <span className="font-medium text-foreground">
              “AS IS” and “AS AVAILABLE”
            </span>{" "}
            basis without warranties of any kind, express or implied.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Service Modifications:
            </span>{" "}
            We reserve the right to modify, suspend, or discontinue any
            feature, prediction model, API integration, or free/pro tier access
            at any time without prior notice or financial liability.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Payments &amp; Non-Refundable Policy:
            </span>{" "}
            Access to premium tiers or features purchased via cryptocurrency or
            other digital payment methods is{" "}
            <span className="font-medium text-foreground">
              strictly non-refundable
            </span>{" "}
            as detailed in our{" "}
            <Link
              href="/refund"
              className="font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
            >
              Refund Policy
            </Link>
            .
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="terms-ip" title="6. Intellectual Property Rights">
        <LegalP>
          All software code, proprietary model architectures, algorithms, MCP
          tool specifications, brand assets, logos, and UI designs associated
          with Exur are the exclusive intellectual property of the Exur
          operators. You are granted a limited, personal, non-exclusive,
          non-transferable, and revokable license to access and use the platform
          in accordance with these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection id="terms-liability" title="7. Limitation of Liability">
        <LegalP>
          To the maximum extent permitted by applicable law, Exur, its
          operators, contributors, infrastructure providers, and third-party
          vendors shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages—including trading losses, loss of
          profits, data loss, service interruption, or system outages—arising
          out of or in connection with your use of or inability to use the
          Service.
        </LegalP>
      </LegalSection>

      <LegalSection
        id="terms-governing-law"
        title="8. Governing Law & Dispute Resolution"
      >
        <LegalP>
          These Terms shall be governed by and construed in accordance with
          general international commercial principles and applicable data
          protection legislation (including EU GDPR standards), without regard
          to conflict of law principles.
        </LegalP>
      </LegalSection>

      <LegalSection id="terms-modifications" title="9. Modifications to Terms">
        <LegalP>
          We reserve the right to update or replace these Terms at any time at
          our sole discretion. Material changes will be communicated via the
          official documentation repository, in-app notices, or platform
          announcements. Your continued use of the Service after effective
          revisions constitutes full acceptance of the updated Terms.
        </LegalP>
      </LegalSection>

      <LegalSection id="terms-contact" title="10. Contact Information">
        <LegalP>
          For legal inquiries, terms clarification, or platform support, please
          contact:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">Legal Team:</span>{" "}
            <a
              href="mailto:legal@exur.ai"
              className="font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
            >
              legal@exur.ai
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">
              Official Legal Documentation Repository:
            </span>{" "}
            <a
              href={LEGAL_DOCS_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
            >
              github.com/exur-ai/exur-legal-docs
            </a>
          </li>
        </LegalList>
      </LegalSection>
    </LegalDocShell>
  )
}

export default TermsPage
