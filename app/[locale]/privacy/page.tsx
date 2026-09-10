import type { Metadata } from "next"

import {
  LegalDocShell,
  LegalList,
  LegalNavButtons,
  LegalOrderedList,
  LegalP,
  LegalSection,
} from "@/components/legal/legal-doc"
import {
  PRIVACY_DESCRIPTION,
  ROOT_ROBOTS,
  SITE_NAME,
} from "@/lib/site"

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
          <p>Effective Date: August 11, 2026</p>
          <p>Version: 1.0.0</p>
          <p>
            Scope: IRIS Intel (
            <span className="font-mono text-foreground/90">
              intel.irislab.info
            </span>
            ), a product module of the IRIS Lab ecosystem (
            <span className="font-mono text-foreground/90">irislab.info</span>
            ).
          </p>
        </>
      }
      intro={
        <LegalP>
          At <span className="font-medium text-foreground">IRIS Lab</span>{" "}
          (“we”, “us”, or “our”), accessible via{" "}
          <span className="font-mono text-foreground/90">
            intel.irislab.info
          </span>
          , we are committed to protecting your privacy and managing your
          personal data transparently. This Privacy Policy explains how we
          collect, use, process, and safeguard your personal data when you
          interact with the IRIS Intel platform.
        </LegalP>
      }
      footerLinks={<LegalNavButtons showPrivacy={false} />}
    >
      <LegalSection id="privacy-controller" title="1. Operator & Controller Notice">
        <LegalP>
          Pending formal corporate entity incorporation,{" "}
          <span className="font-medium text-foreground">IRIS Intel</span> and
          the <span className="font-medium text-foreground">IRIS Lab</span>{" "}
          platform are owned, operated, and maintained by{" "}
          <span className="font-medium text-foreground">
            Hamid Reza Hassani Yaqouti
          </span>{" "}
          as an independent tech initiative. For GDPR and data protection
          compliance purposes, the operator functions as the Data Controller.
        </LegalP>
      </LegalSection>

      <LegalSection id="privacy-collect" title="2. Information We Collect">
        <LegalP>
          We adhere to strict data minimization principles, collecting only the
          information required to deliver, optimize, and secure our market
          intelligence services:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Authentication &amp; Profile Data (via Google OAuth):
            </span>{" "}
            Google user ID, name, email address, and profile picture URL
            associated with your Google account.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Technical &amp; Network Metadata:
            </span>{" "}
            IP Address and approximate geographic location derived from IP (used
            for regional service optimization and security). Device type
            (Desktop vs. Mobile), browser version, and operating system (used to
            optimize user interface responsiveness).
          </li>
          <li>
            <span className="font-medium text-foreground">
              Referral Tracking Data:
            </span>{" "}
            Referral code associations captured upon sign-up to manage campaign
            attributions.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Pro Plan Notification Endpoints:
            </span>{" "}
            Contact endpoints (such as email address, Telegram handle/chat ID,
            or custom Webhook URLs) voluntarily submitted by Pro Plan users for
            alert routing.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="privacy-legal-basis"
        title="3. Legal Basis for Processing (GDPR Compliance)"
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
            Providing access to the IRIS Intel dashboard, quantitative signal
            analytics, historical market databases, and real-time alerts.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Legitimate Interests:
            </span>{" "}
            Securing our platform, optimizing device-specific user interfaces,
            preventing fraudulent API abuse, and analyzing aggregate usage
            patterns.
          </li>
          <li>
            <span className="font-medium text-foreground">Consent:</span> Routing
            automated notifications via user-configured channels (Email,
            Telegram, Webhooks).
          </li>
        </LegalOrderedList>
      </LegalSection>

      <LegalSection
        id="privacy-processors"
        title="4. Third-Party Service Providers & Data Processors"
      >
        <LegalP>
          We utilize trusted third-party infrastructure providers and analytics
          services to operate IRIS Intel:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Cloud Infrastructure &amp; Security:
            </span>{" "}
            Cloudflare, Google Cloud Platform (GCP).
          </li>
          <li>
            <span className="font-medium text-foreground">
              AI Processing Engines:
            </span>{" "}
            OpenAI, Google Gemini, DeepSeek (used strictly for contextual market
            news summarization and algorithmic analytics; no personal user data
            is submitted to AI models).
          </li>
          <li>
            <span className="font-medium text-foreground">
              Market Data &amp; External Protocols:
            </span>{" "}
            CryptoCompare News API, Hyperliquid, X (Twitter API).
          </li>
        </LegalList>
        <LegalP>
          We do not sell, rent, or trade your personal data to third parties
          under any circumstances.
        </LegalP>
      </LegalSection>

      <LegalSection
        id="privacy-retention"
        title="5. Data Retention, Synchronization & Deletion"
      >
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Image &amp; Profile Syncing:
            </span>{" "}
            Profile image URLs are referenced from Google. If you update or
            delete your profile image on Google, the reference on IRIS Intel
            updates or clears automatically.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Data Erasure Rights:
            </span>{" "}
            You may request complete erasure of your stored profile and session
            data at any time by contacting our privacy team.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection
        id="privacy-rights"
        title="6. Your Data Protection Rights (GDPR / CCPA)"
      >
        <LegalP>
          Depending on your geographic location, you possess the following
          rights regarding your personal data:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">
              Right to Access:
            </span>{" "}
            Request a copy of the personal data stored about you.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Right to Rectification:
            </span>{" "}
            Correct incomplete or inaccurate data.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Right to Erasure (“Right to be Forgotten”):
            </span>{" "}
            Request the complete deletion of your records.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Right to Restrict or Object:
            </span>{" "}
            Limit or object to specific processing activities.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Right to Data Portability:
            </span>{" "}
            Obtain your data in a structured, machine-readable format.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="privacy-cookies" title="7. Cookies and Local Storage">
        <LegalP>
          We use essential session tokens and local browser storage strictly
          necessary for authentication state persistence and UI preference
          retention (such as dark mode settings or selected trading pairs). We
          do not deploy invasive third-party tracking cookies.
        </LegalP>
      </LegalSection>

      <LegalSection id="privacy-contact" title="8. Data Protection Contact">
        <LegalP>
          For any questions regarding this Privacy Policy, or to exercise your
          GDPR data protection rights, please contact us at:
        </LegalP>
        <LegalList>
          <li>
            <span className="font-medium text-foreground">Email:</span>{" "}
            <a
              href="mailto:privacy@irislab.info"
              className="font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
            >
              privacy@irislab.info
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">General Legal:</span>{" "}
            <a
              href="mailto:legal@irislab.info"
              className="font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
            >
              legal@irislab.info
            </a>
          </li>
          <li>
            <span className="font-medium text-foreground">
              Version Control Repository:
            </span>{" "}
            <a
              href="https://github.com/irislab-net/iris-legal-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-3 hover:text-foreground/80"
            >
              github.com/irislab-net/iris-legal-docs
            </a>
          </li>
        </LegalList>
      </LegalSection>
    </LegalDocShell>
  )
}

export default PrivacyPage
