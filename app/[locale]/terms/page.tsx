import type { Metadata } from "next"

import {
  LegalDocShell,
  LegalList,
  LegalNavButtons,
  LegalP,
  LegalSection,
} from "@/components/legal/legal-doc"
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
          <p>Effective Date: August 11, 2026</p>
          <p>Version: 1.0.0</p>
          <p>
            Scope: Exur (
            <span className="font-mono text-foreground/90">
              exur.ai
            </span>
            ), a product module of the Exur ecosystem (
            <span className="font-mono text-foreground/90">exur.ai</span>
            ).
          </p>
        </>
      }
      intro={
        <>
          <LegalP>
            Welcome to{" "}
            <span className="font-medium text-foreground">Exur</span>{" "}
            (accessible via{" "}
            <span className="font-mono text-foreground/90">
              exur.ai
            </span>
            ). These Terms of Service (“Terms”) govern your access to and use of
            our website, AI-driven market intelligence tools, analytics
            dashboards, quantitative signals, news aggregations, and associated
            features (collectively, the “Service”).
          </LegalP>
          <LegalP>
            The Service is operated and owned by{" "}
            <span className="font-medium text-foreground">Exur</span>{" "}
            (managed by{" "}
            <span className="font-medium text-foreground">
              Hamid Reza Hassani Yaqouti
            </span>{" "}
            as an individual operator pending formal corporate registration). By
            accessing or using the Service, you agree to be bound by these
            Terms.
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
            All content, automated signal indicators, market analysis, news
            aggregations, confidence scores, and AI-generated outputs available
            on the Service are provided strictly for{" "}
            <span className="font-medium text-foreground">
              informational, educational, and research purposes only
            </span>
            .
          </li>
          <li>
            Exur is not a registered investment advisor, broker-dealer,
            financial analyst, or commodities trader under any regulatory
            authority.
          </li>
          <li>
            Trading cryptocurrencies, digital assets, and derivatives involves
            substantial risk of loss and is not suitable for every investor. You
            are solely responsible for your own trading decisions and financial
            risks. Exur and its operator shall not be liable for any losses,
            damages, or claims arising from reliance on information provided by
            the Service.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="terms-eligibility"
        title="2. Eligibility and Prohibited Jurisdictions"
      >
        <LegalP>By using the Service, you represent and warrant that:</LegalP>
        <LegalList>
          <li>
            You are at least{" "}
            <span className="font-medium text-foreground">18 years of age</span>{" "}
            (or the legal age of majority in your jurisdiction).
          </li>
          <li>
            You are not located in, a citizen of, or a resident of any country
            or territory subject to comprehensive sanctions or embargoes
            administered by OFAC, the European Union, or the United Nations.
          </li>
          <li>
            You are not a{" "}
            <span className="font-medium text-foreground">U.S. Person</span> or
            accessing the Service from within the United States of America,
            where local regulatory compliance laws may restrict access to
            unregulated cryptocurrency analytics tools.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="terms-accounts"
        title="3. User Accounts and Google Authentication"
      >
        <LegalP>
          To access certain features, including the Pro Plan, you may be
          required to log in via Google OAuth. You agree that:
        </LegalP>
        <LegalList>
          <li>
            You are responsible for maintaining the security of your Google
            account.
          </li>
          <li>
            We collect profile data such as Google user ID, name, email
            address, and profile image URL to deliver personalized dashboards,
            notifications, and referral/promotion tracking.
          </li>
          <li>
            We reserve the right to suspend or terminate your access to the
            Service at our sole discretion if you violate these Terms.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="terms-availability"
        title="4. Service Availability & Pro Plan Modifications"
      >
        <LegalP>
          The Service, including free tier data and Pro Plan features (such as
          custom notifications via Email/Telegram/Webhooks, historical market
          analytics, and event tracking), is provided on an{" "}
          <span className="font-medium text-foreground">
            “AS IS” and “AS AVAILABLE”
          </span>{" "}
          basis. We reserve the right to modify, suspend, or discontinue any
          feature, API, or service at any time without prior notice or
          liability.
        </LegalP>
      </LegalSection>

      <LegalSection id="terms-ip" title="5. Intellectual Property">
        <LegalP>
          All software code, user interface designs, proprietary algorithm
          outputs, logos, and branding related to Exur and Exur are
          the intellectual property of the operator. You are granted a limited,
          non-exclusive, non-transferable license to access the Service for
          personal or internal business use.
        </LegalP>
      </LegalSection>

      <LegalSection id="terms-liability" title="6. Limitation of Liability">
        <LegalP>
          To the maximum extent permitted by applicable law, Exur and its
          operator shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, including loss of profits, trading
          losses, data loss, service interruption, or system failure resulting
          from your use of or inability to use the Service.
        </LegalP>
      </LegalSection>

      <LegalSection id="terms-governing-law" title="7. Governing Law">
        <LegalP>
          These Terms shall be governed by and construed in accordance with
          general international commercial principles and applicable laws,
          without regard to conflict of law principles.
        </LegalP>
      </LegalSection>

      <LegalSection id="terms-modifications" title="8. Modifications to Terms">
        <LegalP>
          We reserve the right to modify or replace these Terms at any time at
          our sole discretion. If a revision is material, we will provide notice
          prior to any new terms taking effect via an in-app banner, email
          notification, or an updated prompt upon log-in. By continuing to
          access or use our Service after those revisions become effective, you
          agree to be bound by the revised terms.
        </LegalP>
      </LegalSection>

      <LegalSection id="terms-contact" title="9. Contact Information">
        <LegalP>
          For legal inquiries or support regarding these Terms, please contact
          us at:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">Legal:</span>{" "}
            <a
              href="mailto:legal@exur.ai"
              className="font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
            >
              legal@exur.ai
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">Support:</span>{" "}
            <a
              href="mailto:support@exur.ai"
              className="font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
            >
              support@exur.ai
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">
              Version Control Repository:
            </span>{" "}
            <a
              href="https://github.com/exur-ai/exur-legal-docs"
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
