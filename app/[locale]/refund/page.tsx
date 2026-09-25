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
import { LEGAL_DOCS_REPO_URL } from "@/lib/legal"
import {
  REFUND_DESCRIPTION,
  ROOT_ROBOTS,
  SITE_NAME,
} from "@/lib/site"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: REFUND_DESCRIPTION,
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: "/refund",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/refund",
    siteName: SITE_NAME,
    title: `Refund Policy · ${SITE_NAME}`,
    description: REFUND_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `Refund Policy · ${SITE_NAME}`,
    description: REFUND_DESCRIPTION,
  },
}

function RefundPage() {
  return (
    <LegalDocShell
      title="Refund Policy"
      meta={
        <>
          <LegalMetaChip>Effective Date: September 21, 2026</LegalMetaChip>
          <LegalMetaChip>Version: 2.1.0</LegalMetaChip>
          <LegalMetaChip>
            Scope: Exur Subscriptions (
            <span className="font-mono text-foreground/90">exur.ai</span>
            )
          </LegalMetaChip>
        </>
      }
      intro={
        <LegalP>
          This Refund Policy outlines the billing terms, payment processing,
          cancellation procedures, and refund guidelines for premium tiers,
          subscription plans, and paid features offered by{" "}
          <span className="font-medium text-foreground">Exur</span> (“we”,
          “us”, or “our”) via{" "}
          <span className="font-mono text-foreground/90">exur.ai</span>.
        </LegalP>
      }
      footerLinks={<LegalNavButtons showRefund={false} />}
    >
      <LegalSection id="refund-free-tier" title="1. Free Tier & Evaluation">
        <LegalP>
          To allow users to evaluate our platform before making financial
          commitments, Exur offers a free tier access mode to core
          conversational financial intelligence and basic signal features. Users
          are encouraged to utilize the free tier to determine whether Exur
          meets their research and analytical needs prior to purchasing any
          premium subscription or tier upgrade.
        </LegalP>
      </LegalSection>

      <LegalSection
        id="refund-non-refundable"
        title="2. Strictly Non-Refundable Policy"
      >
        <LegalP>
          Upon purchasing a premium plan, subscription, or paid tier feature on
          Exur:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              All payments and purchases are strictly final and
              non-refundable.
            </span>
          </li>
          <li>
            Because payment grants immediate, unrestricted access to real-time
            computational model outputs, proprietary signal engines, server
            infrastructure allocation, and external LLM routing resources, we
            do not issue full, partial, or prorated refunds under any
            circumstances.
          </li>
          <li>
            This non-refundable policy applies to all payment methods, including
            non-custodial cryptocurrency transactions, digital vouchers, and
            third-party payment gateways.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="refund-cancellation"
        title="3. Subscription Cancellations & Auto-Renewal"
      >
        <LegalList>
          <li>
            You may cancel your paid subscription at any time through your Exur
            account settings.
          </li>
          <li>
            Upon cancellation, your premium features will remain active until
            the end of your current paid billing cycle.
          </li>
          <li>
            Automatic renewal charges (where applicable) will cease immediately
            following cancellation. No recurring fees will be charged after a
            successful cancellation.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="refund-outages"
        title="4. Technical Interruptions & Service Credits"
      >
        <LegalP>
          In the event of a severe, prolonged service outage attributable solely
          to Exur’s primary infrastructure (excluding external API providers or
          general internet disruption) that prevents access to paid features:
        </LegalP>
        <LegalList>
          <li>
            Please notify our support team within{" "}
            <span className="font-medium text-foreground">
              7 calendar days
            </span>{" "}
            of the service interruption.
          </li>
          <li>
            Following verification of server logs and outage reports, we may, at
            our sole discretion, issue appropriate service extensions or
            platform credits. Cash, fiat, or cryptocurrency refunds will not be
            issued.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="refund-fraud"
        title="5. Payment Fraud & Abuse Prevention"
      >
        <LegalP>
          Any attempt to initiate fraudulent chargebacks, payment disputes,
          unauthorized transaction reversals, or fraudulent usage through
          payment gateways or crypto networks will result in the immediate and
          permanent termination of your Exur account, Google OAuth association,
          and access to all connected services.
        </LegalP>
      </LegalSection>

      <LegalSection id="refund-contact" title="6. Billing & Legal Support">
        <LegalP>
          For inquiries regarding active subscriptions, payment processing, or
          account status, please contact:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Legal &amp; Support Team:
            </span>{" "}
            <a
              href="mailto:legal@exur.ai"
              className={legalLinkClass}
            >
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

export default RefundPage
