import { getMarketingPageHref } from "@/lib/site"

/** In-app legal pages (canonical product copies of iris-legal-docs). */
export const TERMS_OF_SERVICE_URL = "/terms"
export const PRIVACY_NOTICE_URL = "/privacy"
export const REFUND_POLICY_URL = "/refund"

/** Desk-safe absolute legal hrefs (avoid chat→apex RSC prefetch CORS). */
export function getTermsOfServiceHref(): string {
  return getMarketingPageHref(TERMS_OF_SERVICE_URL)
}

export function getPrivacyNoticeHref(): string {
  return getMarketingPageHref(PRIVACY_NOTICE_URL)
}

export function getRefundPolicyHref(): string {
  return getMarketingPageHref(REFUND_POLICY_URL)
}

/** Canonical source repository for versioned legal drafts. */
export const LEGAL_DOCS_REPO_URL = "https://github.com/exur-ai/exur-legal-docs"

export {
  COMPANY_DEVELOPMENT_ATTRIBUTION,
  COMPANY_DESCRIPTION,
  COMPANY_NUMBER,
  COMPANIES_HOUSE_URL,
  LEGAL_ENTITY_NAME,
  REGISTERED_OFFICE,
} from "@/lib/company"

/** Query values sent to `/v1/auth/google/login` after the user confirms. */
export const AUTH_TERMS_ACCEPTED = "accepted"
export const AUTH_PRIVACY_NOTICE_ACCEPTED = "accepted"

/**
 * Client + server legal acceptance version.
 * Bump when Terms / Privacy materially change so the login gate re-prompts.
 */
export const LEGAL_ACCEPTANCE_VERSION = "v1"
