"use client"

import { ScrollReveal } from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FAQ_ITEMS, FAQ_SECTION } from "@/lib/landing-modern-data"
import { LANDING_REVEAL } from "@/lib/landing-motion"
import {
  landingAfterHeader,
  landingContent,
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function FaqSection() {
  return (
    <section id="faq" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader title={FAQ_SECTION.title} subtitle={FAQ_SECTION.subtitle} />
        </ScrollReveal>

        <ScrollReveal
          delay={LANDING_REVEAL.stagger}
          className={cn(landingContent, landingAfterHeader)}
        >
          <Accordion defaultValue={["what"]}>
            {FAQ_ITEMS.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-border">
                <AccordionTrigger className="py-4 text-left text-sm font-normal text-foreground hover:no-underline sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  )
}
