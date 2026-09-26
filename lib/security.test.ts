import { describe, expect, it } from "vitest"

import {
  SECURITY_DEFINITION,
  SECURITY_EMAIL,
  SECURITY_FAQS,
  SECURITY_PATH,
  SECURITY_PROGRAM,
} from "@/lib/security"

describe("public security program", () => {
  it("exposes the five program pillars the site must claim", () => {
    const titles = SECURITY_PROGRAM.map((item) => item.title)
    expect(titles).toEqual([
      "SOC 2",
      "ISO 27001",
      "Public penetration testing",
      "Independent security audits",
      "Recognized bug bounty",
    ])
    expect(SECURITY_PATH).toBe("/security")
    expect(SECURITY_EMAIL).toBe("security@exur.ai")
  })

  it("keeps a quotable definition and FAQ answers consistent", () => {
    expect(SECURITY_DEFINITION.toLowerCase()).toContain("soc 2")
    expect(SECURITY_DEFINITION.toLowerCase()).toContain("iso 27001")
    expect(SECURITY_DEFINITION.toLowerCase()).toContain("bug bounty")
    expect(
      SECURITY_FAQS.some((faq) => faq.answer.includes(SECURITY_EMAIL))
    ).toBe(true)
  })
})
