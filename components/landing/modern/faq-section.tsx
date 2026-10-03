"use client"

import { useTranslations } from "next-intl"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FAQ_ITEM_IDS } from "@/lib/landing-modern-data"
import { LANDING_REVEAL } from "@/lib/landing-motion"
import {
  landingAfterHeader,
  landingContent,
  landingDisplay,
  landingGlassSheen,
  landingGlassSurface,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function FaqSection() {
  const t = useTranslations("modern.faq")

  return (
    <section id="faq" className={cn(landingSection, landingSectionBody)}>
      <ScrollReveal>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      </ScrollReveal>

      <ScrollReveal
        delay={LANDING_REVEAL.stagger}
        className={cn(landingContent, landingAfterHeader)}
      >
        <Accordion
          defaultValue={["what"]}
          className="gap-3 sm:gap-3.5"
        >
          {FAQ_ITEM_IDS.map((id) => (
            <AccordionItem
              key={id}
              value={id}
              className={cn(
                landingGlassSurface,
                "relative overflow-hidden rounded-[1.35rem] border-0 bg-white/42 not-last:border-b-0 dark:bg-white/8 sm:rounded-[1.5rem]"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  landingGlassSheen,
                  "pointer-events-none absolute inset-0 rounded-[inherit]"
                )}
              />
              <AccordionTrigger
                className={cn(
                  landingDisplay,
                  "relative z-10 items-center gap-4 px-4 py-4 text-start text-[0.975rem] font-normal tracking-[-0.015em] text-foreground hover:no-underline sm:px-5 sm:py-4.5 sm:text-[1.05rem]",
                  "**:data-[slot=accordion-trigger-icon]:size-4.5 **:data-[slot=accordion-trigger-icon]:text-muted-foreground/70"
                )}
              >
                {t(`items.${id}.question`)}
              </AccordionTrigger>
              <AccordionContent className="relative z-10 px-4 pb-4 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground sm:px-5 sm:pb-5 sm:text-base">
                {t(`items.${id}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>
    </section>
  )
}
