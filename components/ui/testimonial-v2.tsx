"use client"

import { motion, useReducedMotion } from "motion/react"
import { useTranslations } from "next-intl"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import {
  LANDING_CONTAINER,
  LANDING_SECTION_CONTENT_MT,
  LANDING_SECTION_PY,
} from "@/lib/landing-layout"
import { cn } from "@/lib/utils"

type Testimonial = {
  text: string
  image: string
  name: string
  role: string
}

const TESTIMONIAL_IMAGES = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1542204625-de293a09e9e2?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=128&h=128&q=80",
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=128&h=128&q=80",
] as const

const TESTIMONIAL_IDS = ["0", "1", "2", "3", "4", "5", "6", "7", "8"] as const

function quoteInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function TestimonialsColumn({
  testimonials,
  duration = 16,
  className,
}: {
  testimonials: readonly Testimonial[]
  duration?: number
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={className}>
      <motion.ul
        animate={reduceMotion ? undefined : { translateY: "-50%" }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
              }
        }
        className="m-0 flex list-none flex-col gap-4 p-0 pb-4"
      >
        {[0, 1].map((dupIndex) => (
          <li key={`wrap-${dupIndex}`} aria-hidden={dupIndex === 1}>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {testimonials.map((item) => (
                <li key={`${dupIndex}-${item.name}`}>
                  <Card className="border-border/70 bg-card/80 py-0 shadow-sm backdrop-blur-sm">
                    <CardContent className="space-y-5 p-5">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.text}
                      </p>
                      <div className="flex items-center gap-3">
                        <Avatar size="lg">
                          <AvatarImage src={item.image} alt={item.name} />
                          <AvatarFallback>{quoteInitials(item.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                            {item.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </motion.ul>
    </div>
  )
}

export default function TestimonialV2() {
  const t = useTranslations("landing.testimonials")
  const testimonials: Testimonial[] = TESTIMONIAL_IDS.map((id, index) => ({
    text: t(`items.${id}.text`),
    name: t(`items.${id}.name`),
    role: t(`items.${id}.role`),
    image: TESTIMONIAL_IMAGES[index],
  }))
  const firstColumn = testimonials.slice(0, 3)
  const secondColumn = testimonials.slice(3, 6)
  const thirdColumn = testimonials.slice(6, 9)

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className={cn("bg-background", LANDING_SECTION_PY)}
    >
      <ScrollReveal className={LANDING_CONTAINER}>
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full px-3">
            {t("badge")}
          </Badge>
          <h2
            id="testimonials-heading"
            className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            {t("title")}
          </h2>
        </div>

        <div
          data-reveal
          className={cn(
            "max-h-168 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]",
            LANDING_SECTION_CONTENT_MT
          )}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TestimonialsColumn testimonials={firstColumn} duration={16} />
            <TestimonialsColumn
              testimonials={secondColumn}
              duration={20}
              className="hidden md:block"
            />
            <TestimonialsColumn
              testimonials={thirdColumn}
              duration={18}
              className="hidden lg:block"
            />
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
