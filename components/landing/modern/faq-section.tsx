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
        <Accordion defaultValue={["what"]}>
          {FAQ_ITEM_IDS.map((id) => (
            <AccordionItem key={id} value={id} className="border-border">
              <AccordionTrigger className="py-4 text-left text-sm font-normal text-foreground hover:no-underline sm:text-base">
                {t(`items.${id}.question`)}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                {t(`items.${id}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>
    </section>
  )
}
