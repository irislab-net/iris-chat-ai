"use client"

import { MenuIcon } from "lucide-react"
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
import { Link } from "@/i18n/navigation"
import { NAV_LINKS, scrollToSection } from "@/lib/landing-modern-data"
import { landingDisplay, landingInner } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

function scrollAndClose(id: string, close: () => void) {
  close()
  window.setTimeout(() => scrollToSection(id), 150)
}

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="relative z-50 pt-5 sm:pt-6 lg:pt-8">
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
          className="h-auto min-w-0 shrink-0 justify-self-start gap-2.5 rounded-full px-0 py-0 text-white hover:bg-white/10"
        >
          <IrisLabLogo decorative size={40} variant="on-hero" className="size-10 shrink-0" />
          <span className={cn(landingDisplay, "text-lg font-semibold tracking-tight text-white")}>
            Exur
          </span>
        </Button>

        <div
          className="hidden items-center justify-center gap-8 md:flex md:col-start-2 md:row-start-1 lg:gap-10"
        >
          {NAV_LINKS.map((link) => (
            <Button
              key={link.id}
              type="button"
              variant="ghost"
              onClick={() => scrollToSection(link.id)}
              className="h-auto rounded-full px-0 py-0 text-sm font-medium text-white/90 hover:bg-transparent hover:text-white"
            >
              {link.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 justify-self-end md:col-start-3 md:row-start-1">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full text-white hover:bg-white/10 md:hidden"
                  aria-label="Open menu"
                >
                  <MenuIcon className="size-4" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] border-black/10 bg-white p-0">
              <SheetHeader className="border-b border-black/6 px-5 py-4 text-left">
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
                {NAV_LINKS.map((link) => (
                  <SheetClose
                    key={link.id}
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => scrollAndClose(link.id, () => setOpen(false))}
                        className="h-auto justify-start rounded-2xl px-4 py-3 text-sm font-medium text-[#525866] hover:bg-[#F5F5F7] hover:text-[#0F172A]"
                      >
                        {link.label}
                      </Button>
                    }
                  />
                ))}
                <div className="mt-3 border-t border-black/6 px-1 pt-3">
                  <LocaleSwitcher
                    variant="chip"
                    className="w-full"
                    buttonClassName="w-full justify-center rounded-2xl border-black/10 text-[#525866]"
                  />
                </div>
                <SheetClose
                  render={
                    <Button
                      nativeButton={false}
                      render={<Link href={APP_NEWS_PATH} />}
                      className="mt-2 h-auto justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-black/90"
                    >
                      Get Started
                    </Button>
                  }
                />
              </div>
            </SheetContent>
          </Sheet>

          <SphereCta
            href={APP_NEWS_PATH}
            className="hidden rounded-full bg-black px-5 py-2.5 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-black/90 sm:inline-flex"
            iconClassName="bg-white/15 text-white"
          >
            Get Started
          </SphereCta>
        </div>
      </nav>
    </header>
  )
}
