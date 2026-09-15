"use client"

import { ArrowUpIcon } from "lucide-react"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { scrollToSection } from "@/lib/landing-modern-data"
import { landingSection } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

export function MeetExurSection() {
  return (
    <section
      id="meet-exur"
      className={cn("relative overflow-hidden", landingSection)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[560px] bg-[radial-gradient(ellipse_at_bottom,rgba(37,99,235,0.10),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-12">
        <ScrollReveal>
          <p className="mb-6 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#2563EB]">
            Autonomous Personal Finance
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight text-[#0F172A] sm:text-6xl">
            Meet Your Financial Brain
            <span className="text-[#2563EB]">.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#525866] sm:text-lg">
            The intelligence is ready. Not a chatbot. Not a trading bot. An always-on
            financial intelligence that observes, understands, protects, and decides — for
            one person.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button
              nativeButton={false}
              render={<Link href={APP_NEWS_PATH} />}
              className="group h-auto gap-3 rounded-full bg-[#2563EB] px-10 py-4 text-base font-semibold text-white shadow-[0_12px_40px_rgba(37,99,235,0.40)] hover:bg-[#1D4ED8] hover:shadow-[0_16px_50px_rgba(37,99,235,0.50)]"
            >
              Launch App
              <ArrowUpIcon className="size-[17px] transition-transform duration-300 group-hover:-translate-y-1" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => scrollToSection("top")}
              className="h-auto rounded-full border-black/15 bg-transparent px-8 py-4 text-base font-semibold text-[#0F172A] hover:border-[#2563EB]/50 hover:bg-transparent hover:text-[#2563EB]"
            >
              Back to top
            </Button>
          </div>

          <p className="mx-auto mt-14 max-w-md font-[family-name:var(--font-display)] text-lg font-medium leading-snug text-[#0F172A]">
            &quot;I am the intelligent layer responsible for your financial life.&quot;
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#868C98]">
            You + Your Money + The Markets + The World
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
