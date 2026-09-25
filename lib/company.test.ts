import { describe, expect, it } from "vitest"

import {
  COMPANY_DEVELOPMENT_ATTRIBUTION,
  COMPANY_DESCRIPTION,
  COMPANY_NUMBER,
  COMPANIES_HOUSE_URL,
  LEGAL_ENTITY_NAME,
  REGISTERED_OFFICE,
} from "@/lib/company"

describe("company record (Companies House)", () => {
  it("uses the exact legal name and company number", () => {
    expect(LEGAL_ENTITY_NAME).toBe("IRIS DIGITAL VENTURES LTD")
    expect(COMPANY_NUMBER).toBe("14995497")
  })

  it("attributes development without ownership or operator claims", () => {
    expect(COMPANY_DEVELOPMENT_ATTRIBUTION.toLowerCase()).toContain(
      "developed under"
    )
    expect(COMPANY_DEVELOPMENT_ATTRIBUTION.toLowerCase()).not.toContain(
      "owned by"
    )
    expect(COMPANY_DEVELOPMENT_ATTRIBUTION.toLowerCase()).not.toContain(
      "operated by"
    )
    expect(COMPANY_DESCRIPTION).toContain(
      "UK private limited company incorporated in England"
    )
  })

  it("points at the official Companies House record and registered office", () => {
    expect(COMPANIES_HOUSE_URL).toBe(
      "https://find-and-update.company-information.service.gov.uk/company/14995497"
    )
    expect(REGISTERED_OFFICE).toContain("Hatton Garden")
    expect(REGISTERED_OFFICE).toContain("EC1N 8DX")
  })
})
