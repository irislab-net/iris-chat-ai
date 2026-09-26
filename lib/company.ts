/**
 * UK company record for Exur development attribution.
 *
 * Source of truth (Companies House):
 * https://find-and-update.company-information.service.gov.uk/company/14995497
 */

export const LEGAL_ENTITY_NAME = "IRIS DIGITAL VENTURES LTD" as const

export const COMPANY_NUMBER = "14995497" as const

export const COMPANY_TYPE = "Private limited company" as const

/** ISO-style display date; Companies House: incorporated on 11 July 2023. */
export const INCORPORATED_ON = "11 July 2023" as const

export const REGISTERED_OFFICE =
  "34-35 Hatton Garden, Unit 3a, Suite 3227, London, England, EC1N 8DX" as const

export const COMPANIES_HOUSE_URL =
  "https://find-and-update.company-information.service.gov.uk/company/14995497" as const

export const COMPANY_SIC_CODES = [
  {
    code: "62012",
    description: "Business and domestic software development",
  },
  {
    code: "66110",
    description: "Administration of financial markets",
  },
] as const

export const COMPANY_DEVELOPMENT_ATTRIBUTION =
  `Exur was developed under ${LEGAL_ENTITY_NAME} (Company No. ${COMPANY_NUMBER}).` as const

export const COMPANY_DESCRIPTION =
  `${LEGAL_ENTITY_NAME}, a UK private limited company incorporated in England.` as const
