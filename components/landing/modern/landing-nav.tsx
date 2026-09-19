"use client"

import { gsap } from "gsap"
import { EclipseIcon, UserRoundIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"
import { useEffect, useState } from "react"

import { ChatAccountMenu } from "@/components/app-shell/chat-account-menu"
import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { AnimatedIrisLabLogo } from "@/components/brand/animated-iris-lab-logo"
import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { LocaleSwitcher } from "@/components/i18n/locale-switcher"
import { SphereCta } from "@/components/landing/modern/sphere-ui"
import { ThemeModeControl } from "@/components/landing/modern/theme-mode-control"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useLandingActiveSection } from "@/components/landing/modern/landing-scroll-context"
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
import { APP_NEWS_PATH } from "@/lib/site"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

function scrollAndClose(id: string, close: () => void) {
  close()
  gsap.delayedCall(LANDING_MOTION.durationFast * 0.3, () => scrollToSection(id))
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

function LandingThemeToggle() {
  const t = useTranslations("common")
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      className={landingNavIconButtonClass}
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
      <EclipseIcon className="relative z-10 size-4" />
    </Button>
  )
}

/** Desktop: compact avatar right of Start Free. */
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
          {loginPending ? t("connecting") : "Continue with Google"}
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
        <p className="truncate text-[12px] text-muted-foreground">
          {userAccountSubline(user) ?? displayPlanName(user.tier)}
        </p>
      </div>
    </div>
  )
}

export function LandingNav() {
  const [open, setOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const { activeSectionId } = useLandingActiveSection()

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
          "grid grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
          "rounded-[28px] transition-[background-color,box-shadow,backdrop-filter,padding] duration-300 ease-out",
          stuck
            ? "bg-white/72 py-2 shadow-[0_10px_40px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl dark:bg-background/72 dark:shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)]"
            : "bg-transparent py-0 shadow-none"
        )}
        aria-label="Landing"
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => scrollToSection("top")}
          aria-label="Exur"
          className="h-auto min-w-0 shrink-0 justify-self-start gap-2.5 rounded-full px-0 py-0 text-foreground hover:bg-muted"
        >
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card p-1 shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
            aria-hidden
          >
            <AnimatedIrisLabLogo replayOnHover shimmer className="size-9" />
          </span>
          <span className={landingTitleBrand}>Exur</span>
        </Button>

        <div
          className={cn(
            landingNavPill,
            "hidden transition-all duration-300 md:col-start-2 md:row-start-1 md:flex",
            stuck && "bg-muted/70 shadow-none"
          )}
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeSectionId === link.id
            return (
              <Button
                key={link.id}
                type="button"
                variant="ghost"
                onClick={() => scrollToSection(link.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "h-8 rounded-full px-3.5 py-0 text-[13px] tracking-[-0.01em] transition-all duration-200 lg:px-4",
                  isActive ? landingNavLinkActive : landingNavLinkInactive
                )}
              >
                {link.label}
              </Button>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 justify-self-end sm:gap-2 md:col-start-3 md:row-start-1">
          <div className="hidden items-center gap-1.5 md:flex">
            <LandingThemeToggle />
            <LocaleSwitcher
              variant="icon"
              buttonClassName={landingNavIconButtonClass}
            />
          </div>

          <SphereCta href={APP_NEWS_PATH} variant="glass" size="sm">
            Start Free
          </SphereCta>

          <div className="hidden md:block">
            <LandingNavAccount />
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(landingNavIconButtonClass, "md:hidden")}
                  aria-label="Open menu"
                >
                  <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
                  <NavMenuIcon />
                </Button>
              }
            />
            <SheetContent
              side="right"
              showCloseButton={false}
              className={cn(
                "gap-0 border-0 bg-card p-0 text-foreground shadow-[0_24px_80px_rgba(15,23,42,0.14)]",
                "dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
                "top-3 right-3 bottom-3 left-auto h-auto w-[min(calc(100vw-1.5rem),20rem)] rounded-[1.75rem]",
                "data-[side=right]:top-3 data-[side=right]:right-3 data-[side=right]:bottom-3 data-[side=right]:left-auto",
                "data-[side=right]:h-auto data-[side=right]:w-[min(calc(100vw-1.5rem),20rem)] data-[side=right]:sm:max-w-none"
              )}
            >
              <SheetHeader className="flex-row items-center justify-between gap-3 p-5 pb-3 text-left">
                <SheetTitle
                  className={cn(
                    landingTitleBrand,
                    "flex items-center gap-2.5"
                  )}
                >
                  <IrisLabLogo
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
                      aria-label="Close menu"
                    />
                  }
                >
                  <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
                  <XIcon className="relative z-10 size-4" />
                </SheetClose>
              </SheetHeader>

              <nav className="flex flex-1 flex-col gap-1 px-3 pt-2" aria-label="Mobile">
                <div className="mb-2">
                  <LandingSheetAccount onDone={() => setOpen(false)} />
                </div>
                {NAV_LINKS.map((link) => {
                  const isActive = activeSectionId === link.id
                  return (
                    <Button
                      key={link.id}
                      type="button"
                      variant="ghost"
                      onClick={() => scrollAndClose(link.id, () => setOpen(false))}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "h-12 justify-start rounded-2xl px-4 text-[15px] tracking-[-0.01em]",
                        isActive
                          ? "bg-muted font-semibold text-foreground hover:bg-muted hover:text-foreground"
                          : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Button>
                  )
                })}
              </nav>

              <div className="mt-auto flex flex-col gap-3 p-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <SphereCta href={APP_NEWS_PATH} variant="glass" className="w-full">
                  Start Free
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
