"use client"

import { useState } from "react"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { LocaleSwitcher } from "@/components/i18n/locale-switcher"
import { SphereCta } from "@/components/landing/modern/sphere-ui"
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
import { NAV_LINKS, scrollToSection } from "@/lib/landing-modern-data"
import {
  landingDisplay,
  landingGlassNavIcon,
  landingGlassSheen,
  landingInner,
} from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

function scrollAndClose(id: string, close: () => void) {
  close()
  window.setTimeout(() => scrollToSection(id), 150)
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
  const { activeSectionId } = useLandingActiveSection()

  return (
    <header className="relative z-50 pt-3 sm:pt-4 lg:pt-5">
      <nav
        className={cn(
          landingInner,
          "grid grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
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
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-[0_6px_18px_rgba(15,23,42,0.07)]"
            aria-hidden
          >
            <IrisLabLogo decorative size={36} variant="on-light" className="size-9" />
          </span>
          <span
            className={cn(
              landingDisplay,
              "hidden text-lg font-semibold tracking-tight text-[#0F172A] min-[420px]:inline"
            )}
          >
            Exur
          </span>
        </Button>

        <div
          className="hidden items-center justify-center gap-6 md:flex md:col-start-2 md:row-start-1 lg:gap-8"
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
                  "relative h-auto rounded-full px-0 py-0 text-[13px] font-medium tracking-[-0.01em] transition-colors hover:bg-transparent sm:text-sm",
                  isActive ? "text-[#0F172A]" : "text-[#64748B] hover:text-[#0F172A]"
                )}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[#0F172A]"
                    aria-hidden
                  />
                )}
              </Button>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 justify-self-end md:col-start-3 md:row-start-1">
          <SphereCta
            href={APP_NEWS_PATH}
            variant="glass"
            iconClassName="max-md:hidden"
            className="shrink-0 px-3.5 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Try Free
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
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <SheetHeader className="bg-[#F8FAFC] px-5 py-4 text-left">
                <SheetTitle
                  className={cn(
                    landingDisplay,
                    "flex items-center gap-2.5 text-sm font-bold text-[#0F172A]"
                  )}
                >
                  <IrisLabLogo
                    decorative
                    size={28}
                    variant="on-light"
                    className="size-7 overflow-hidden rounded-full bg-white"
                  />
                  Exur
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 p-3">
                {NAV_LINKS.map((link) => {
                  const isActive = activeSectionId === link.id
                  return (
                    <SheetClose
                      key={link.id}
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => scrollAndClose(link.id, () => setOpen(false))}
                          aria-current={isActive ? "true" : undefined}
                          className={cn(
                            "h-auto justify-start rounded-2xl px-4 py-3 text-sm font-medium hover:bg-[#F5F5F7]",
                            isActive
                              ? "bg-[#F1F5F9] text-[#0F172A] hover:text-[#0F172A]"
                              : "text-[#525866] hover:text-[#0F172A]"
                          )}
                        >
                          {link.label}
                        </Button>
                      }
                    />
                  )
                })}
                <div className="mt-3 bg-[#F8FAFC] px-1 py-3">
                  <LocaleSwitcher
                    variant="chip"
                    className="w-full"
                    buttonClassName="w-full justify-center rounded-2xl bg-white text-[#525866] shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
