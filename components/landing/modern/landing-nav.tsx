"use client"

import {
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"
import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { AnimatedExurLogo } from "@/components/brand/animated-exur-logo"
import { ExurLogo } from "@/components/brand/exur-logo"
import { LocaleSwitcher } from "@/components/i18n/locale-switcher"
import { useLandingActiveSection } from "@/components/landing/modern/landing-scroll-context"
import { SphereCta } from "@/components/landing/modern/sphere-ui"
import { ThemeModeControl } from "@/components/landing/modern/theme-mode-control"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SelectionCheckBadge } from "@/components/ui/selection-check-badge"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { displayPlanName } from "@/lib/billing/catalog"
import { NAV_LINKS } from "@/lib/landing-modern-data"
import { LANDING_MOTION, scrollToSection } from "@/lib/landing-motion"
import {
  landingGlassLight,
  landingGlassNavIcon,
  landingGlassSheen,
  landingGlassSurface,
  landingInner,
  landingNavLinkActive,
  landingNavLinkInactive,
  landingNavPill,
  landingTitleBrand,
} from "@/lib/landing-modern-styles"
import { getLaunchAppHref, getMarketingHomePath } from "@/lib/site"
import { localeDirection } from "@/lib/i18n/locale"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

function isLandingNavActive(
  link: (typeof NAV_LINKS)[number],
  {
    pathname,
    onLanding,
    activeSectionId,
  }: {
    pathname: string
    onLanding: boolean
    activeSectionId: string
  }
) {
  const href = "href" in link ? link.href : undefined
  if (href) {
    return pathname === href || pathname.endsWith(href)
  }
  if (!onLanding) return false
  if (activeSectionId === link.id) return true
  // #pay sits just above pricing; keep Pricing lit while that band is in view.
  return link.id === "pricing" && activeSectionId === "pay"
}

const landingSheetGoogleCtaClass = cn(
  landingGlassSurface,
  "relative h-12 w-full justify-center gap-2.5 rounded-full border-0 bg-white/55 px-4 text-[15px] font-semibold shadow-none hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/14"
)

const landingSheetNavItemClass =
  "h-11 w-full justify-start rounded-2xl px-3.5 text-[15px] tracking-[-0.01em] transition-colors duration-150"

const landingSheetLocaleClass = cn(
  landingGlassSurface,
  "h-11 w-full justify-center gap-2 rounded-full border-0 bg-white/55 px-3 text-[13px] font-medium text-foreground shadow-none hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/14"
)

const ChatAccountMenu = dynamic(
  () =>
    import("@/components/app-shell/chat-account-menu").then(
      (m) => m.ChatAccountMenu
    ),
  {
    ssr: false,
    loading: () => (
      <span
        className="inline-flex size-10 shrink-0 rounded-full bg-muted/40"
        aria-hidden
      />
    ),
  }
)

function scrollAndClose(
  id: string,
  close: () => void,
  navigate: (id: string) => void
) {
  close()
  window.setTimeout(
    () => navigate(id),
    LANDING_MOTION.durationFast * 0.3 * 1000
  )
}

function NavMenuIcon() {
  return (
    <span className="relative z-10 flex w-4 flex-col gap-1.25" aria-hidden>
      <span className="h-0.5 w-full rounded-full bg-foreground" />
      <span className="h-0.5 w-full rounded-full bg-foreground" />
    </span>
  )
}

const landingNavIconButtonClass = cn(
  landingGlassNavIcon,
  "relative size-10! shrink-0 rounded-full p-0 text-foreground hover:bg-transparent"
)

type ThemeChoice = "system" | "light" | "dark"

const THEME_CHOICES: {
  value: ThemeChoice
  icon: typeof MonitorIcon
  labelKey: "themeSystem" | "themeLight" | "themeDark"
}[] = [
  { value: "light", icon: SunIcon, labelKey: "themeLight" },
  { value: "dark", icon: MoonIcon, labelKey: "themeDark" },
  { value: "system", icon: MonitorIcon, labelKey: "themeSystem" },
]

function LandingThemeToggle() {
  const t = useTranslations("common")
  const { theme, setTheme } = useTheme()
  const active: ThemeChoice =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system"
  const ActiveIcon =
    THEME_CHOICES.find((choice) => choice.value === active)?.icon ?? MonitorIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className={landingNavIconButtonClass}
            aria-label={t("theme")}
          />
        }
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <ActiveIcon className="relative z-10 size-4" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="min-w-40">
        {THEME_CHOICES.map(({ value, icon: Icon, labelKey }) => (
          <DropdownMenuItem
            key={value}
            className="min-h-9 gap-2"
            onClick={() => setTheme(value)}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {t(labelKey)}
            {active === value ? (
              <SelectionCheckBadge className="ms-auto" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Desktop: compact avatar right of Application. */
function LandingNavAccount() {
  const t = useTranslations("workspace")
  const { user, loading, login, loginPending } = useAuth()

  if (loading) {
    return (
      <span
        className={cn(
          landingGlassNavIcon,
          "flex size-10 shrink-0 items-center justify-center rounded-full"
        )}
        aria-hidden
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <UserRoundIcon className="relative z-10 size-4 text-muted-foreground" />
      </span>
    )
  }

  if (!user) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={landingNavIconButtonClass}
        aria-label={t("signIn")}
        disabled={loginPending}
        onClick={() => login({ source: "toolbar" })}
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <Avatar className="relative z-10 size-8 after:hidden">
          <AvatarFallback className="bg-transparent text-foreground">
            <GoogleGlyph className="size-4" />
          </AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  return (
    <ChatAccountMenu
      variant="desktop"
      className={cn(
        landingGlassNavIcon,
        "relative size-10! shrink-0 rounded-full p-0 hover:bg-transparent"
      )}
    />
  )
}

/** Mobile sheet: signed-in account row (guest Google CTA lives in the footer). */
function LandingSheetAccount() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        className={cn(
          landingGlassSurface,
          "flex h-12 items-center gap-3 rounded-2xl bg-white/45 px-4 dark:bg-white/8"
        )}
      >
        <span className="size-8 animate-pulse rounded-full bg-muted" />
        <span className="h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div
      className={cn(
        landingGlassSurface,
        "relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white/55 px-3 py-2.5 dark:bg-white/10"
      )}
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-2xl")} />
      <ChatAccountMenu
        variant="desktop"
        className="relative z-10 h-auto shrink-0 rounded-full p-0.5 hover:bg-transparent"
      />
      <div className="relative z-10 min-w-0 flex-1">
        <p className="truncate text-[15px] leading-tight font-medium text-foreground">
          {userAccountLabel(user)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {userAccountSubline(user) ?? displayPlanName(user.tier)}
        </p>
      </div>
    </div>
  )
}

function LandingSheetGoogleCta({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("workspace")
  const { login, loginPending } = useAuth()

  return (
    <Button
      type="button"
      variant="ghost"
      className={landingSheetGoogleCtaClass}
      disabled={loginPending}
      onClick={() => {
        onDone?.()
        login({ source: "toolbar" })
      }}
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
      <GoogleGlyph className="relative z-10 size-5 shrink-0" />
      <span className="relative z-10 truncate">
        {loginPending ? t("connecting") : t("continueWithGoogle")}
      </span>
    </Button>
  )
}

export function LandingNav() {
  const tNav = useTranslations("modern.nav")
  const tAria = useTranslations("nav")
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const isRtl = localeDirection(locale) === "rtl"
  const [open, setOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const { activeSectionId } = useLandingActiveSection()
  const { user, loading: authLoading } = useAuth()
  const homePath = getMarketingHomePath()
  const onLanding = pathname === homePath || pathname === "/home"
  const showGuestCtas = !authLoading && !user

  function goToSection(id: string) {
    if (onLanding) {
      scrollToSection(id)
      return
    }
    router.push(`${homePath}#${id}`)
  }

  function goHome() {
    if (onLanding) {
      scrollToSection("top")
      return
    }
  }

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 pt-3 sm:pt-4 lg:pt-5",
        // Opaque wash over the sticky top inset + rounded-nav corner cutouts
        // so scrolled content cannot peek through on iPhone-class viewports.
        stuck && "bg-background"
      )}
    >
      <nav
        className={cn(
          landingInner,
          "grid grid-cols-[1fr_auto] items-center gap-2.5 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
          "rounded-[28px] transition-[background-color,box-shadow,backdrop-filter,padding] duration-300 ease-out",
          stuck
            ? "bg-white py-2 shadow-[0_10px_40px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:bg-background dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)]"
            : "bg-transparent py-0 shadow-none"
        )}
        aria-label={tAria("aria")}
      >
        {onLanding ? (
          <Button
            type="button"
            variant="ghost"
            onClick={goHome}
            aria-label="Exur"
            className="h-auto min-w-0 shrink-0 gap-2.5 justify-self-start rounded-full px-0 py-0 text-foreground hover:bg-muted"
          >
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card p-1 shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
              aria-hidden
            >
              <AnimatedExurLogo replayOnHover shimmer className="size-9" />
            </span>
            <span className={landingTitleBrand}>Exur</span>
          </Button>
        ) : (
          <Link
            href={homePath}
            aria-label="Exur"
            className="inline-flex h-auto min-w-0 shrink-0 items-center gap-2.5 justify-self-start rounded-full px-0 py-0 text-foreground transition-colors hover:bg-muted"
          >
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card p-1 shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
              aria-hidden
            >
              <AnimatedExurLogo replayOnHover shimmer className="size-9" />
            </span>
            <span className={landingTitleBrand}>Exur</span>
          </Link>
        )}

        <ul
          className={cn(
            landingNavPill,
            "hidden list-none transition-all duration-300 lg:col-start-2 lg:row-start-1 lg:flex",
            stuck && "bg-muted/70 shadow-none"
          )}
        >
          {NAV_LINKS.map((link) => {
            const href = "href" in link ? link.href : undefined
            const isActive = isLandingNavActive(link, {
              pathname,
              onLanding,
              activeSectionId,
            })
            const className = cn(
              "h-8 rounded-full px-3 py-0 text-[13px] tracking-[-0.01em] transition-all duration-200",
              isActive ? landingNavLinkActive : landingNavLinkInactive
            )

            return (
              <li key={link.id}>
                {href ? (
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center justify-center",
                      className
                    )}
                  >
                    {tNav(link.id)}
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goToSection(link.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={className}
                  >
                    {tNav(link.id)}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex shrink-0 items-center justify-end gap-2 justify-self-end sm:gap-2 lg:col-start-3 lg:row-start-1">
          <div className="hidden items-center gap-1.5 lg:flex">
            <LandingThemeToggle />
            <LocaleSwitcher
              variant="icon"
              buttonClassName={landingNavIconButtonClass}
            />
          </div>

          <SphereCta href={getLaunchAppHref()} variant="glass" size="sm">
            {tNav("application")}
          </SphereCta>

          <div className="hidden lg:block">
            <LandingNavAccount />
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(landingNavIconButtonClass, "lg:hidden")}
                  aria-label={tNav("openMenu")}
                >
                  <span
                    aria-hidden
                    className={cn(landingGlassSheen, "rounded-full")}
                  />
                  <NavMenuIcon />
                </Button>
              }
            />
            <SheetContent
              side="bottom"
              dir={isRtl ? "rtl" : "ltr"}
              showCloseButton={false}
              className={cn(
                landingGlassLight,
                "gap-0 border-0 p-0 text-foreground",
                "max-h-[min(92dvh,720px)] w-full rounded-t-[28px] rounded-b-none",
                "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:max-h-[min(92dvh,720px)]"
              )}
            >
              <div
                aria-hidden
                className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-foreground/15 dark:bg-white/20"
              />

              <SheetHeader className="flex-row items-center justify-between gap-3 px-5 pt-1 pb-2 text-start">
                <SheetTitle
                  className={cn(landingTitleBrand, "flex items-center gap-2.5")}
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card p-1 shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:bg-white/10 dark:shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
                    aria-hidden
                  >
                    <ExurLogo
                      decorative
                      size={32}
                      variant="auto"
                      className="size-8"
                    />
                  </span>
                  Exur
                </SheetTitle>
                <SheetClose
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "relative size-10! shrink-0 rounded-full p-0 text-foreground hover:bg-transparent",
                        landingGlassNavIcon
                      )}
                      aria-label={tNav("closeMenu")}
                    />
                  }
                >
                  <span
                    aria-hidden
                    className={cn(landingGlassSheen, "rounded-full")}
                  />
                  <XIcon className="relative z-10 size-4" />
                </SheetClose>
              </SheetHeader>

              <nav
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pt-1"
                aria-label={tNav("mobileNav")}
              >
                <LandingSheetAccount />

                <ul
                  className={cn(
                    landingNavPill,
                    "flex list-none flex-col gap-0.5 rounded-[1.35rem] p-1.5"
                  )}
                >
                  {NAV_LINKS.map((link) => {
                    const href = "href" in link ? link.href : undefined
                    const isActive = isLandingNavActive(link, {
                      pathname,
                      onLanding,
                      activeSectionId,
                    })
                    const className = cn(
                      landingSheetNavItemClass,
                      isActive
                        ? landingNavLinkActive
                        : landingNavLinkInactive
                    )

                    return (
                      <li key={link.id} className="w-full">
                        {href ? (
                          <Link
                            href={href}
                            onClick={() => setOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "inline-flex items-center",
                              className
                            )}
                          >
                            {tNav(link.id)}
                          </Link>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              scrollAndClose(
                                link.id,
                                () => setOpen(false),
                                goToSection
                              )
                            }
                            aria-current={isActive ? "true" : undefined}
                            className={className}
                          >
                            {tNav(link.id)}
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <SheetFooter className="mt-auto gap-0 border-0 px-5 pt-3 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))]">
                <div className="mb-6 flex w-full flex-col gap-2">
                  {showGuestCtas ? (
                    <LandingSheetGoogleCta onDone={() => setOpen(false)} />
                  ) : null}
                  <SphereCta
                    href={getLaunchAppHref()}
                    variant="glass"
                    size="md"
                    className="w-full"
                  >
                    {tNav("application")}
                  </SphereCta>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <ThemeModeControl className="min-w-0 bg-white/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] dark:bg-white/8" />
                  <LocaleSwitcher
                    variant="chip"
                    buttonClassName={landingSheetLocaleClass}
                  />
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
