import { getTranslations } from "next-intl/server"

import { ScrollReveal } from "@/components/landing/scroll-reveal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Link } from "@/i18n/navigation"
import {
  LANDING_CONTAINER,
  LANDING_SECTION_CONTENT_MT,
  LANDING_SECTION_PY,
  LANDING_SECTION_TITLE,
} from "@/lib/landing-layout"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"
import { JsonLd } from "@/components/seo/json-ld"

const FAQ_IDS = [
  "what",
  "news",
  "chatbot",
  "ask",
  "account",
  "free",
  "profits",
] as const

export async function LandingFaq() {
  const t = await getTranslations("landing.faq")
  const common = await getTranslations("common")

  const faqs = FAQ_IDS.map((id) => ({
    id,
    question: t(`items.${id}Q`),
    answer: t(`items.${id}A`),
  }))

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text:
          faq.id === "free"
            ? `${faq.answer} ${common("seePricing")}`
            : faq.answer,
      },
    })),
  }

  return (
    <section
      id="faq"
      aria-labelledby="landing-faq-heading"
      className={cn("bg-background", LANDING_SECTION_PY)}
    >
      <JsonLd data={faqLd} />
      <ScrollReveal className={LANDING_CONTAINER}>
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t("eyebrow")}
          </p>
          <h2 id="landing-faq-heading" className={LANDING_SECTION_TITLE}>
            {t("title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:mt-4 md:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div data-reveal className={cn("mx-auto max-w-2xl", LANDING_SECTION_CONTENT_MT)}>
          <Accordion defaultValue={["what"]}>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="py-3.5 text-sm hover:no-underline md:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-[15px] leading-relaxed text-muted-foreground">
                  {faq.answer}
                  {faq.id === "free" ? (
                    <>
                      {" "}
                      <Link
                        href={UPGRADE_PATH}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {common("pricingLink")}
                      </Link>
                      .
                    </>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollReveal>
    </section>
  )
}
