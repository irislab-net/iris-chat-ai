"use client"

import { gsap } from "gsap"
import { useEffect, useState } from "react"

import { AnimatedIrisLabLogo } from "@/components/brand/animated-iris-lab-logo"
import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { LocaleSwitcher } from "@/components/i18n/locale-switcher"
import { SphereCta } from "@/components/landing/modern/sphere-ui"
import { ThemeModeControl } from "@/components/landing/modern/theme-mode-control"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { XIcon } from "lucide-react"
import { useLandingActiveSection } from "@/components/landing/modern/landing-scroll-context"
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
import { cn } from "@/lib/utils"

function scrollAndClose(id: string, close: () => void) {
  close()
  gsap.delayedCall(LANDING_MOTION.durationFast * 0.3, () => scrollToSection(id))
}

function NavMenuIcon() {
  return (
    <span className="relative z-10 flex w-4 flex-col gap-1.25" aria-hidden>
      <span className="h-0.5 w-full rounded-full bg-[#0F172A]" />
      <span className="h-0.5 w-full rounded-full bg-[#0F172A]" />
    </span>
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
            ? "bg-white/72 py-2 shadow-[0_10px_40px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl"
            : "bg-transparent py-0 shadow-none"
        )}
        aria-label="Landing"
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => scrollToSection("top")}
          aria-label="Exur"
          className="h-auto min-w-0 shrink-0 justify-self-start gap-2.5 rounded-full px-0 py-0 text-[#0F172A] hover:bg-[#F1F5F9]"
        >
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
            aria-hidden
          >
            <AnimatedIrisLabLogo replayOnHover shimmer className="size-9" />
          </span>
          <span className={cn(landingTitleBrand, "hidden min-[420px]:inline")}>
            Exur
          </span>
        </Button>

        <div
          className={cn(
            landingNavPill,
            "hidden transition-all duration-300 md:col-start-2 md:row-start-1 md:flex",
            stuck && "bg-[#F1F5F9]/70 shadow-none"
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

        <div className="flex shrink-0 items-center justify-end gap-2 justify-self-end md:col-start-3 md:row-start-1">
          <SphereCta href={APP_NEWS_PATH} variant="glass" size="sm">
            Start Free
          </SphereCta>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "relative size-10! shrink-0 rounded-full p-0 text-[#0F172A] hover:bg-transparent md:hidden",
                    landingGlassNavIcon
                  )}
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
                "gap-0 border-0 bg-white p-0 text-[#0F172A] shadow-[0_24px_80px_rgba(15,23,42,0.14)]",
                "dark:bg-[#111827] dark:text-white dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
                "top-3 right-3 bottom-3 left-auto h-auto w-[min(calc(100vw-1.5rem),20rem)] rounded-[1.75rem]",
                "data-[side=right]:top-3 data-[side=right]:right-3 data-[side=right]:bottom-3 data-[side=right]:left-auto",
                "data-[side=right]:h-auto data-[side=right]:w-[min(calc(100vw-1.5rem),20rem)] data-[side=right]:sm:max-w-none"
              )}
            >
              <SheetHeader className="flex-row items-center justify-between gap-3 p-5 pb-3 text-left">
                <SheetTitle
                  className={cn(
                    landingTitleBrand,
                    "flex items-center gap-2.5 dark:text-white"
                  )}
                >
                  <IrisLabLogo
                    decorative
                    size={36}
                    variant="auto"
                    className="size-9 overflow-hidden rounded-full bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:bg-white/10"
                  />
                  Exur
                </SheetTitle>
                <SheetClose
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "relative size-10! shrink-0 rounded-full p-0 text-[#0F172A] hover:bg-transparent dark:text-white",
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
                          ? "bg-[#F1F5F9] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:bg-white/10 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                          : "font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] dark:text-white/55 dark:hover:bg-white/5 dark:hover:text-white"
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
                  buttonClassName="h-10 w-full justify-center rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15 dark:hover:text-white"
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
