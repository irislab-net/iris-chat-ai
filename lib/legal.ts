/** In-app legal pages (canonical product copies of iris-legal-docs). */
export const TERMS_OF_SERVICE_URL = "/terms"
export const PRIVACY_NOTICE_URL = "/privacy"
export const REFUND_POLICY_URL = "/refund"

/** Canonical source repository for versioned legal drafts. */
export const LEGAL_DOCS_REPO_URL =
  "https://github.com/exur-ai/exur-legal-docs"

export {
  COMPANY_DEVELOPMENT_ATTRIBUTION,
  COMPANY_HISTORICAL_DESCRIPTION,
  COMPANY_NUMBER,
  COMPANY_STATUS_NOTICE,
  COMPANIES_HOUSE_URL,
  LEGAL_ENTITY_NAME,
  REGISTERED_OFFICE,
} from "@/lib/company"

/** Query values sent to `/v1/auth/google/login` after the user confirms. */
export const AUTH_TERMS_ACCEPTED = "accepted"
export const AUTH_PRIVACY_NOTICE_ACCEPTED = "accepted"
