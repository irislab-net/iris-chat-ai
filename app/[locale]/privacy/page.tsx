import type { Metadata } from "next"

import {
  LegalDocShell,
  LegalList,
  LegalMetaChip,
  LegalNavButtons,
  LegalOrderedList,
  LegalP,
  LegalSection,
  legalLinkClass,
} from "@/components/legal/legal-doc"
import { CompanyInformation } from "@/components/legal/company-information"
import { Link } from "@/i18n/navigation"
import {
  COMPANY_NUMBER,
  COMPANIES_HOUSE_URL,
  LEGAL_ENTITY_NAME,
} from "@/lib/company"
import { LEGAL_DOCS_REPO_URL } from "@/lib/legal"
import { PRIVACY_DESCRIPTION, ROOT_ROBOTS, SITE_NAME } from "@/lib/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: PRIVACY_DESCRIPTION,
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/privacy",
    siteName: SITE_NAME,
    title: `Privacy Policy · ${SITE_NAME}`,
    description: PRIVACY_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `Privacy Policy · ${SITE_NAME}`,
    description: PRIVACY_DESCRIPTION,
  },
}

function PrivacyPage() {
  return (
    <LegalDocShell
      title="Privacy Policy & GDPR Notice"
      meta={
        <>
          <LegalMetaChip>Effective Date: September 21, 2026</LegalMetaChip>
          <LegalMetaChip>Version: 2.1.0</LegalMetaChip>
          <LegalMetaChip>
            Scope: Exur (
            <span className="font-mono text-foreground/90">exur.ai</span>)
          </LegalMetaChip>
        </>
      }
      intro={
        <LegalP>
          At <span className="font-medium text-foreground">Exur</span> (“we”,
          “us”, or “our”), operating via{" "}
          <span className="font-mono text-foreground/90">exur.ai</span>, we are
          dedicated to safeguarding your privacy and managing your personal data
          with institutional-grade security and transparency. This Privacy
          Policy explains how we collect, process, store, and protect your data
          when you interact with the Exur platform, its Model Context Protocol
          (MCP) integrations, conversational financial interfaces, and
          algorithmic signal engines. For SOC 2, ISO 27001, penetration testing,
          independent audits, and the bug bounty program, see{" "}
          <Link href="/security" className={legalLinkClass}>
            Security
          </Link>
          .
        </LegalP>
      }
      footerLinks={<LegalNavButtons showPrivacy={false} />}
    >
      <LegalSection
        id="privacy-controller"
        title="1. Operator & Controller Notice"
      >
        <LegalP>
          Exur was developed under{" "}
          <span className="font-medium text-foreground">
            {LEGAL_ENTITY_NAME}
          </span>{" "}
          (Company No.{" "}
          <span className="font-mono text-foreground/90">{COMPANY_NUMBER}</span>
          ), a UK private limited company incorporated in England.
        </LegalP>
        <LegalP>
          The Exur platform (
          <span className="font-mono text-foreground/90">exur.ai</span>) acts as
          the Data Controller under applicable data protection legislation,
          including the European Union General Data Protection Regulation (EU
          GDPR). Official Companies House details are available at the{" "}
          <a
            href={COMPANIES_HOUSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={legalLinkClass}
          >
            Companies House record
          </a>
          .
        </LegalP>
      </LegalSection>

      <LegalSection
        id="privacy-age"
        title="2. Age Eligibility (18+ Requirement)"
      >
        <LegalP>
          Exur is strictly intended for users who are at least{" "}
          <span className="font-medium text-foreground">18 years of age</span>{" "}
          (or the age of legal majority in their jurisdiction). We do not
          knowingly collect or process personal data from individuals under 18.
          If we become aware that a user under the age of 18 has created an
          account or provided personal information, we will take immediate steps
          to terminate the account and erase the associated data.
        </LegalP>
      </LegalSection>

      <LegalSection id="privacy-collect" title="3. Information We Collect">
        <LegalP>
          We adhere to strict data minimization principles, collecting only the
          information strictly necessary to provide personalized financial
          intelligence, conversational analytics, and signal processing:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Authentication &amp; Profile Data (via Google OAuth):
            </span>{" "}
            Google User ID, primary email address, full name, and profile
            picture URL. Essential OAuth tokens required for identity
            verification and continuous secure session management.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Conversational &amp; Contextual Interaction Data:
            </span>{" "}
            User chat inputs, prompts, conversation history, and system
            responses. Generated market signals, custom watchlist parameters,
            and user-defined financial preferences saved to deliver a
            personalized experience.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Technical &amp; Infrastructure Metadata:
            </span>{" "}
            IP address and coarse geographic region derived from IP (used for
            security, latency routing, and regional compliance). System
            diagnostics, browser specifications, operating system details, and
            interaction timestamps.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Notification Preferences:
            </span>{" "}
            User configuration settings regarding alerts, market news updates,
            and push/email notifications, which can be enabled or disabled at
            any time via account settings.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="privacy-ai"
        title="4. How We Process Data & AI Architecture"
      >
        <LegalP>
          Exur utilizes a layered intelligence architecture combining
          proprietary prediction models and third-party Large Language Model
          (LLM) routing engines:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Proprietary Market Models &amp; MCP Engines:
            </span>{" "}
            Our proprietary prediction models evaluate quantitative market data,
            order book dynamics, and technical indicators via Model Context
            Protocol (MCP) interfaces. These models run on our dedicated
            infrastructure and process anonymized financial data.
          </li>
          <li>
            <span className="font-medium text-foreground">
              LLM Orchestration via OpenRouter:
            </span>{" "}
            Conversational AI capabilities are routed through{" "}
            <span className="font-medium text-foreground">OpenRouter</span>,
            leveraging upstream LLM providers, including{" "}
            <span className="font-medium text-foreground">Google Gemini</span>{" "}
            and <span className="font-medium text-foreground">OpenAI</span>.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Data Privacy in AI Processing:
            </span>{" "}
            Prompts sent to external LLM providers contain the contextual data
            necessary for natural language reasoning. Personal user identifiers
            (such as Google account IDs) are stripped or anonymized prior to
            routing through AI models. Upstream AI providers process data
            strictly as data processors and are prohibited from using your
            personal chat inputs to train public foundational models.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="privacy-cookies" title="5. Analytics & Cookies">
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Essential Session Storage:
            </span>{" "}
            We use essential cookies and browser Local Storage strictly
            necessary for maintaining your authentication state, security
            tokens, and user preferences (e.g., UI theme).
          </li>
          <li>
            <span className="font-medium text-foreground">
              Anonymized Analytics (Google Analytics):
            </span>{" "}
            We use Google Analytics to measure aggregate platform metrics,
            feature usage, and traffic performance. All analytics data is
            collected using IP anonymization and aggregated privacy techniques.
            We do not correlate Google Analytics data with your Google OAuth
            identity or private chat history.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="privacy-legal-basis"
        title="6. Legal Basis for Processing (GDPR Compliance)"
      >
        <LegalP>
          If you reside in the European Economic Area (EEA), the United Kingdom,
          or applicable jurisdictions, we process your personal data under the
          following legal grounds:
        </LegalP>
        <LegalOrderedList>
          <li>
            <span className="font-medium text-foreground">
              Performance of a Contract:
            </span>{" "}
            Providing access to the Exur conversational interface, market signal
            engine, user history synchronization, and personalized financial
            analytics.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Legitimate Interests:
            </span>{" "}
            Securing our platform against abuse, monitoring system performance,
            debugging backend faults, and optimizing user experience.
          </li>
          <li>
            <span className="font-medium text-foreground">Consent:</span>{" "}
            User-initiated authentication via Google OAuth and optional
            notification settings (e.g., market alerts and news updates).
          </li>
        </LegalOrderedList>
      </LegalSection>

      <LegalSection
        id="privacy-processors"
        title="7. Data Storage, Server Locations & Third-Party Processors"
      >
        <LegalP>
          Your data is stored and processed on secure servers located primarily
          within the{" "}
          <span className="font-medium text-foreground">
            European Union (Germany)
          </span>{" "}
          to ensure strict adherence to EU data protection laws:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Primary Database &amp; Hosting Infrastructure:
            </span>{" "}
            Dedicated self-hosted databases and compute infrastructure hosted on{" "}
            <span className="font-medium text-foreground">
              Hetzner Online GmbH (Germany)
            </span>
            .
          </li>
          <li>
            <span className="font-medium text-foreground">
              Current &amp; Future Third-Party Infrastructure Processors:
            </span>{" "}
            To ensure platform availability, error tracking, and scaling, Exur
            utilizes (or reserves the right to utilize) the following cloud and
            data infrastructure service providers:
            <LegalList>
              <li>
                <span className="font-medium text-foreground">
                  Google Cloud Platform (GCP) &amp; Amazon Web Services (AWS):
                </span>{" "}
                For cloud compute, object storage, and global infrastructure
                routing.
              </li>
              <li>
                <span className="font-medium text-foreground">Sentry:</span> For
                operational error logging, real-time bug tracking, and
                performance diagnostics.
              </li>
              <li>
                <span className="font-medium text-foreground">Neon DB:</span>{" "}
                For cloud-native serverless PostgreSQL database operations.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  OpenRouter / Google / OpenAI:
                </span>{" "}
                For large language model inference and conversational AI
                processing.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Google Analytics:
                </span>{" "}
                For anonymized user interface analytics and usage statistics.
              </li>
            </LegalList>
          </li>
        </LegalList>
        <LegalP>
          We do not sell, rent, or trade your personal data to third parties
          under any circumstances.
        </LegalP>
      </LegalSection>

      <LegalSection
        id="privacy-terms-refund"
        title="8. Terms of Service & Refund Policy"
      >
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Free Tier Service:
            </span>{" "}
            Exur offers access to its core conversational intelligence and basic
            market signal features free of charge.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Cryptocurrency Payments:
            </span>{" "}
            For premium tiers or future Pro features, payments may be processed
            via non-custodial cryptocurrency gateways or digital voucher
            providers.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Strict Non-Refundable Policy:
            </span>{" "}
            Because Exur grants immediate access to real-time computational
            models, proprietary signals, and server infrastructure upon
            activation,{" "}
            <span className="font-medium text-foreground">
              all payments made to Exur are non-refundable
            </span>
            . No full, partial, or prorated refunds will be issued once payment
            is completed. See our{" "}
            <Link href="/refund" className={legalLinkClass}>
              Refund Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className={legalLinkClass}>
              Terms of Service
            </Link>
            .
          </li>
          <li>
            <span className="font-medium text-foreground">
              Service Availability:
            </span>{" "}
            The platform is provided on an “as-is” and “as-available” basis.
            Technical interruptions or infrastructure updates do not entitle
            users to monetary refunds.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="privacy-retention"
        title="9. Data Retention & Erasure Rights (GDPR / CCPA)"
      >
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Retention Period:
            </span>{" "}
            We retain your account data and chat history for as long as your
            account remains active or as required to maintain service
            continuity.
          </li>
          <li>
            <span className="font-medium text-foreground">User Rights:</span>{" "}
            Under GDPR and international privacy frameworks, you hold the
            following rights:
            <LegalList>
              <li>
                <span className="font-medium text-foreground">
                  Right to Access:
                </span>{" "}
                Request a copy of the personal data stored in your account.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Right to Rectification:
                </span>{" "}
                Request correction of inaccurate account data.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Right to Erasure (“Right to be Forgotten”):
                </span>{" "}
                Request permanent deletion of your Google account association,
                chat history, and stored preferences.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Right to Restrict Processing:
                </span>{" "}
                Request restrictions on how your data is processed.
              </li>
            </LegalList>
          </li>
          <li>
            <span className="font-medium text-foreground">
              Exercising Your Rights:
            </span>{" "}
            To request account deletion or data exports, please submit an
            official request to our legal team.{" "}
            <a
              id="request-data-deletion"
              href="mailto:legal@exur.ai?subject=Data%20deletion%20request"
              className={legalLinkClass}
            >
              Email legal@exur.ai to request deletion
            </a>
            .
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="privacy-disclaimer" title="10. Financial Disclaimer">
        <LegalP>
          Exur is an AI-native market intelligence and research platform. Exur
          does <span className="font-medium text-foreground">not</span> provide
          regulated financial advice, investment advisory services, or legal
          counsel. Market predictions, model outputs, and conversational
          responses are generated for informational and analytical purposes
          only. Users bear sole responsibility for their trading decisions and
          financial risk management.
        </LegalP>
      </LegalSection>

      <LegalSection id="privacy-company" title="12. Company Information">
        <CompanyInformation
          registerLabel="Companies House record"
          variant="legal"
        />
      </LegalSection>

      <LegalSection id="privacy-contact" title="13. Contact Information">
        <LegalP>
          For privacy inquiries, GDPR data requests, or legal notices, please
          contact:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Legal &amp; Privacy Team:
            </span>{" "}
            <a href="mailto:legal@exur.ai" className={legalLinkClass}>
              legal@exur.ai
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">
              Official Documentation Repository:
            </span>{" "}
            <a
              href={LEGAL_DOCS_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={legalLinkClass}
            >
              github.com/exur-ai/exur-legal-docs
            </a>
          </li>
        </LegalList>
      </LegalSection>
    </LegalDocShell>
  )
}

export default PrivacyPage
