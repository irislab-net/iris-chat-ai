import {
  COMPANY_DEVELOPMENT_ATTRIBUTION,
  COMPANY_HISTORICAL_DESCRIPTION,
  COMPANY_NUMBER,
  COMPANY_STATUS_NOTICE,
  COMPANIES_HOUSE_URL,
  LEGAL_ENTITY_NAME,
  REGISTERED_OFFICE,
} from "@/lib/company"
import { cn } from "@/lib/utils"

type CompanyInformationProps = {
  className?: string
  /** Section heading (already translated by the caller). */
  heading?: string
  /** Link label for the Companies House record (already translated). */
  registerLabel: string
  /** Compact footer treatment vs. fuller legal-page block. */
  variant?: "footer" | "legal"
}

/**
 * Discreet historical company attribution.
 * Does not claim current ownership/operation; omits director/PSC details.
 */
function CompanyInformation({
  className,
  heading,
  registerLabel,
  variant = "footer",
}: CompanyInformationProps) {
  const isFooter = variant === "footer"

  return (
    <section
      aria-labelledby={heading ? "company-information-heading" : undefined}
      aria-label={heading ? undefined : "Company information"}
      className={cn(
        isFooter
          ? "max-w-xl text-xs leading-relaxed text-muted-foreground"
          : "space-y-3 text-sm leading-relaxed text-muted-foreground",
        className
      )}
    >
      {heading ? (
        <h2
          id="company-information-heading"
          className={cn(
            isFooter
              ? "text-xs font-medium text-muted-foreground"
              : "text-[1.125rem] font-normal tracking-[-0.015em] text-foreground sm:text-lg"
          )}
        >
          {heading}
        </h2>
      ) : null}
      <div className={cn("space-y-1.5", isFooter && heading ? "mt-1.5" : undefined)}>
        <p>{COMPANY_DEVELOPMENT_ATTRIBUTION}</p>
        <p>{COMPANY_HISTORICAL_DESCRIPTION}</p>
        <p>{COMPANY_STATUS_NOTICE}</p>
        <p>
          <span className="text-muted-foreground/90">Company No.</span>{" "}
          <span className="font-mono text-foreground/80">{COMPANY_NUMBER}</span>
          {" · "}
          <span className="text-muted-foreground/90">{LEGAL_ENTITY_NAME}</span>
        </p>
        {!isFooter ? <p>Registered office: {REGISTERED_OFFICE}</p> : null}
        <p>
          <a
            href={COMPANIES_HOUSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground",
              isFooter && "text-muted-foreground"
            )}
          >
            {registerLabel}
          </a>
        </p>
      </div>
    </section>
  )
}

export { CompanyInformation }
