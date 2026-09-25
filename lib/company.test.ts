import { describe, expect, it } from "vitest"

import {
  COMPANY_DEVELOPMENT_ATTRIBUTION,
  COMPANY_HISTORICAL_DESCRIPTION,
  COMPANY_NUMBER,
  COMPANY_STATUS,
  COMPANY_STATUS_NOTICE,
  COMPANIES_HOUSE_URL,
  DISSOLVED_ON,
  LEGAL_ENTITY_NAME,
  REGISTERED_OFFICE,
} from "@/lib/company"

describe("historical company record (Companies House)", () => {
  it("uses the exact legal name and company number", () => {
    expect(LEGAL_ENTITY_NAME).toBe("IRIS DIGITAL VENTURES LTD")
    expect(COMPANY_NUMBER).toBe("14995497")
  })

  it("records dissolved status and does not claim active operation", () => {
    expect(COMPANY_STATUS).toBe("Dissolved")
    expect(DISSOLVED_ON).toBe("22 October 2024")
    expect(COMPANY_STATUS_NOTICE.toLowerCase()).toContain("dissolved")
    expect(COMPANY_DEVELOPMENT_ATTRIBUTION.toLowerCase()).toContain(
      "developed under"
    )
    expect(COMPANY_DEVELOPMENT_ATTRIBUTION.toLowerCase()).not.toContain(
      "owned by"
    )
    expect(COMPANY_DEVELOPMENT_ATTRIBUTION.toLowerCase()).not.toContain(
      "operated by"
    )
    expect(COMPANY_HISTORICAL_DESCRIPTION).toContain(
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
