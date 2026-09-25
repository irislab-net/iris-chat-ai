"use client"

import { gsap } from "gsap"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon, UserRoundIcon, XIcon } from "lucide-react"
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { displayPlanName } from "@/lib/billing/catalog"
import { NAV_LINKS } from "@/lib/landing-modern-data"
import { LANDING_MOTION, scrollToSection } from "@/lib/landing-motion"
import {
  landingGlassNavIcon,
  landingTitleBrand,
  landingGlassSheen,
  landingInner,
  landingNavLinkActive,
  landingNavLinkInactive,
  landingNavPill,
} from "@/lib/landing-modern-styles"
import { getLaunchAppHref, getMarketingHomePath } from "@/lib/site"
import { localeDirection } from "@/lib/i18n/locale"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

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
  gsap.delayedCall(LANDING_MOTION.durationFast * 0.3, () => navigate(id))
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
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system"
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
              <CheckIcon className="ms-auto size-4 opacity-70" aria-hidden />
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
        className={cn(landingGlassNavIcon, "flex size-10 shrink-0 items-center justify-center rounded-full")}
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

/** Mobile sheet: first item — Continue with Google, or signed-in account row. */
function LandingSheetAccount({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("workspace")
  const { user, loading, login, loginPending } = useAuth()

  if (loading) {
    return (
      <div className="flex h-12 items-center gap-3 rounded-2xl bg-muted/50 px-4">
        <span className="size-8 animate-pulse rounded-full bg-muted" />
        <span className="h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!user) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full justify-start gap-3 rounded-2xl border-border/60 bg-background px-4 text-[15px] font-medium shadow-none"
        disabled={loginPending}
        onClick={() => {
          onDone?.()
          login({ source: "toolbar" })
        }}
      >
        <GoogleGlyph className="size-5 shrink-0" />
        <span className="truncate">
          {loginPending ? t("connecting") : t("continueWithGoogle")}
        </span>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2.5">
      <ChatAccountMenu
        variant="desktop"
        className="h-auto shrink-0 rounded-full p-0.5 hover:bg-transparent"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-tight text-foreground">
          {userAccountLabel(user)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {userAccountSubline(user) ?? displayPlanName(user.tier)}
        </p>
      </div>
    </div>
  )
}

export function LandingNav() {
  const tNav = useTranslations("modern.nav")
  const tAria = useTranslations("nav")
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const isRtl = localeDirection(locale) === "rtl"
  const sheetSide = isRtl ? "left" : "right"
  const [open, setOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const { activeSectionId } = useLandingActiveSection()
  const homePath = getMarketingHomePath()
  const onLanding =
    pathname === "/home" || pathname === "/" || pathname === homePath

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
    <header className="sticky top-0 z-50 pt-3 sm:pt-4 lg:pt-5">
      <nav
        className={cn(
          landingInner,
          "grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
          "rounded-[28px] transition-[background-color,box-shadow,backdrop-filter,padding] duration-300 ease-out",
          stuck
            ? "bg-white/72 py-2 shadow-[0_10px_40px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl dark:bg-background/72 dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)]"
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
            className="h-auto min-w-0 shrink-0 justify-self-start gap-2.5 rounded-full px-0 py-0 text-foreground hover:bg-muted"
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
            className="inline-flex h-auto min-w-0 shrink-0 items-center justify-self-start gap-2.5 rounded-full px-0 py-0 text-foreground transition-colors hover:bg-muted"
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
            const isActive = onLanding && activeSectionId === link.id
            return (
              <li key={link.id}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => goToSection(link.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "h-8 rounded-full px-3 py-0 text-[13px] tracking-[-0.01em] transition-all duration-200",
                    isActive ? landingNavLinkActive : landingNavLinkInactive
                  )}
                >
                  {tNav(link.id)}
                </Button>
              </li>
            )
          })}
        </ul>

        <div className="flex shrink-0 items-center justify-end gap-1.5 justify-self-end sm:gap-2 lg:col-start-3 lg:row-start-1">
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
                  <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
                  <NavMenuIcon />
                </Button>
              }
            />
            <SheetContent
              side={sheetSide}
              dir={isRtl ? "rtl" : "ltr"}
              showCloseButton={false}
              className={cn(
                "gap-0 border-0 bg-card p-0 text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.14)]",
                "dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
                "top-3 bottom-3 h-auto w-[min(calc(100vw-1.5rem),20rem)] rounded-[1.75rem]",
                "inset-s-auto inset-e-3 left-auto right-auto",
                "data-[side=left]:top-3 data-[side=left]:bottom-3 data-[side=left]:inset-s-auto data-[side=left]:inset-e-3 data-[side=left]:left-auto data-[side=left]:right-auto data-[side=left]:h-auto data-[side=left]:w-[min(calc(100vw-1.5rem),20rem)] data-[side=left]:sm:max-w-none",
                "data-[side=right]:top-3 data-[side=right]:bottom-3 data-[side=right]:inset-s-auto data-[side=right]:inset-e-3 data-[side=right]:left-auto data-[side=right]:right-auto data-[side=right]:h-auto data-[side=right]:w-[min(calc(100vw-1.5rem),20rem)] data-[side=right]:sm:max-w-none"
              )}
            >
              <SheetHeader className="flex-row items-center justify-between gap-3 p-5 pb-3 text-start">
                <SheetTitle
                  className={cn(
                    landingTitleBrand,
                    "flex items-center gap-2.5"
                  )}
                >
                  <ExurLogo
                    decorative
                    size={36}
                    variant="auto"
                    className="size-9 overflow-hidden rounded-full bg-card shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:bg-white/10"
                  />
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
                  <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
                  <XIcon className="relative z-10 size-4" />
                </SheetClose>
              </SheetHeader>

              <nav className="flex flex-1 flex-col gap-1 px-3 pt-2" aria-label={tNav("mobileNav")}>
                <div className="mb-2">
                  <LandingSheetAccount onDone={() => setOpen(false)} />
                </div>
                <ul className="flex list-none flex-col gap-1">
                  {NAV_LINKS.map((link) => {
                    const isActive = onLanding && activeSectionId === link.id
                    return (
                      <li key={link.id}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            scrollAndClose(link.id, () => setOpen(false), goToSection)
                          }
                          aria-current={isActive ? "true" : undefined}
                          className={cn(
                            "h-12 w-full justify-start rounded-2xl px-4 text-[15px] tracking-[-0.01em]",
                            isActive
                              ? "bg-muted font-semibold text-foreground hover:bg-muted hover:text-foreground"
                              : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          {tNav(link.id)}
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="mt-auto flex flex-col gap-3 p-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <SphereCta href={getLaunchAppHref()} variant="glass" className="w-full">
                  {tNav("application")}
                </SphereCta>
                <ThemeModeControl />
                <LocaleSwitcher
                  variant="chip"
                  className="w-full"
                  buttonClassName="h-10 w-full justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
