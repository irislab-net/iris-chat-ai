"use client"

import { ArrowUpRightIcon, MenuIcon } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { LocaleSwitcher } from "@/components/i18n/locale-switcher"
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
import { LANDING_EASE } from "@/lib/landing-modern-styles"
import { NAV_LINKS, scrollToSection } from "@/lib/landing-modern-data"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

function scrollAndClose(id: string, close: () => void) {
  close()
  window.setTimeout(() => scrollToSection(id), 150)
}

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.4, ease: LANDING_EASE }}
      className="fixed top-4 left-1/2 z-50 w-[92%] max-w-4xl -translate-x-1/2 sm:top-5"
    >
      <nav
        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-full border border-black/10 bg-white/80 px-3 py-2 shadow-lg shadow-black/4 backdrop-blur-xl sm:gap-4 sm:px-5 sm:py-2.5"
        aria-label="Landing"
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => scrollToSection("top")}
          aria-label="Exur"
          className="h-auto min-w-0 shrink-0 gap-2 rounded-full px-1 py-0 hover:bg-transparent"
        >
          <IrisLabLogo
            decorative
            size={32}
            className="size-8 shrink-0 rounded-full [&_img.absolute]:!hidden"
            priority
          />
          <span className="hidden font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.22em] text-[#0F172A] sm:inline">
            EXUR
          </span>
        </Button>

        <div className="hidden items-center justify-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.id}
              type="button"
              variant="ghost"
              onClick={() => scrollToSection(link.id)}
              className="h-auto rounded-full px-0 py-0 text-[13px] font-medium text-[#525866] hover:bg-transparent hover:text-[#0F172A]"
            >
              {link.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
          <LocaleSwitcher
            variant="icon"
            buttonClassName="hidden size-9 rounded-full text-[#525866] hover:bg-black/5 hover:text-[#0F172A] lg:inline-flex"
          />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full text-[#525866] hover:bg-black/5 hover:text-[#0F172A] md:hidden"
                  aria-label="Open menu"
                >
                  <MenuIcon className="size-4" />
                </Button>
              }
            />
            <SheetContent
              side="right"
              className="w-[min(100vw-2rem,20rem)] border-black/10 bg-white p-0"
            >
              <SheetHeader className="border-b border-black/6 px-5 py-4 text-left">
                <SheetTitle className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.22em] text-[#0F172A]">
                  <IrisLabLogo
                    decorative
                    size={28}
                    className="size-7 rounded-full [&_img.absolute]:!hidden"
                  />
                  EXUR
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
                    buttonClassName="w-full justify-center rounded-2xl border-black/10 text-[#525866] hover:bg-[#F5F5F7] hover:text-[#0F172A]"
                  />
                </div>
                <SheetClose
                  render={
                    <Button
                      nativeButton={false}
                      render={<Link href={APP_NEWS_PATH} />}
                      className="mt-2 h-auto justify-center rounded-2xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                    >
                      Start Free
                    </Button>
                  }
                />
              </div>
            </SheetContent>
          </Sheet>

          <Button
            nativeButton={false}
            render={<Link href={APP_NEWS_PATH} />}
            className={cn(
              "group h-auto shrink-0 gap-1.5 rounded-full bg-[#2563EB] px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_18px_rgba(37,99,235,0.28)] hover:bg-[#1D4ED8]",
              "sm:px-4 sm:py-2.5"
            )}
          >
            <span className="hidden sm:inline">Start Free</span>
            <span className="sm:hidden">Start</span>
            <ArrowUpRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Button>
        </div>
      </nav>
    </motion.header>
  )
}
