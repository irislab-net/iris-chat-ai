import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { TrackedContactLink } from "@/components/analytics/tracked-contact-link"
import { Link } from "@/i18n/navigation"
import { landingContainer } from "@/lib/landing-modern-styles"
import { SOCIAL_X_URL } from "@/lib/site"
import { cn } from "@/lib/utils"

type FooterLink = {
  label: string
  href: string
  external?: boolean
}

const FOOTER_LINKS: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "About", href: "/about" },
  { label: "X / Twitter", href: SOCIAL_X_URL, external: true },
]

export function ModernFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-black/[0.07] bg-[#FBFBFD]">
      <div
        className={cn(
          landingContainer,
          "flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2.5">
            <IrisLabLogo
              decorative
              size={28}
              className="size-7 rounded-full [&_img.absolute]:!hidden"
            />
            <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.22em] text-[#0F172A]">
              EXUR
            </span>
          </div>
          <p className="text-xs text-[#868C98]">
            © {year} EXUR Inc. Your Financial Brain.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-7 gap-y-2">
          {FOOTER_LINKS.map((link) =>
            link.external ? (
              <TrackedContactLink
                key={link.label}
                href={link.href}
                channel="x"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#868C98] transition-colors duration-200 hover:text-[#0F172A]"
              >
                {link.label}
              </TrackedContactLink>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[#868C98] transition-colors duration-200 hover:text-[#0F172A]"
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      </div>
    </footer>
  )
}
