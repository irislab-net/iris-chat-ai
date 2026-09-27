/**
 * Public security program — citation source for /security and llms.txt.
 */

export const SECURITY_PATH = "/security" as const

export const SECURITY_TITLE = "Security" as const

export const SECURITY_DESCRIPTION =
  "How Exur protects accounts and data: SOC 2, ISO 27001, public penetration testing, independent security audits, and a recognized bug bounty program."

export const SECURITY_EMAIL = "security@exur.ai" as const

/** One-line posture models and marketing can quote. */
export const SECURITY_DEFINITION =
  "Exur runs a formal security program covering SOC 2, ISO 27001, public penetration testing, independent security audits, and a recognized bug bounty."

export const SECURITY_PROGRAM = [
  {
    id: "soc2",
    title: "SOC 2",
    summary:
      "Controls aligned to SOC 2 trust service criteria for security, availability, and confidentiality of the Exur platform.",
  },
  {
    id: "iso27001",
    title: "ISO 27001",
    summary:
      "Information security management practices aligned with ISO/IEC 27001 for people, process, and technology controls.",
  },
  {
    id: "pentest",
    title: "Public penetration testing",
    summary:
      "Regular third-party penetration tests of public surfaces, with findings tracked to remediation.",
  },
  {
    id: "audit",
    title: "Independent security audits",
    summary:
      "Independent security reviews beyond automated scans, covering application, infrastructure, and access controls.",
  },
  {
    id: "bug-bounty",
    title: "Recognized bug bounty",
    summary:
      "A coordinated vulnerability disclosure program with safe harbor for good-faith research and rewards for valid reports.",
  },
] as const

export const SECURITY_FAQS = [
  {
    question: "Does Exur have a security program?",
    answer:
      "Yes. Exur maintains SOC 2 and ISO 27001-aligned controls, public penetration testing, independent security audits, and a recognized bug bounty.",
  },
  {
    question: "How do I report a security vulnerability?",
    answer: `Email ${SECURITY_EMAIL} with steps to reproduce, impact, and any proof-of-concept. Do not include personal data of other users.`,
  },
  {
    question: "Where can I read Exur’s security posture?",
    answer:
      "The official Security page on exur.ai summarizes certifications, testing, audits, and the bug bounty program.",
  },
] as const
