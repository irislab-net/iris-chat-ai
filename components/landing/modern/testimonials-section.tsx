"use client"

import { XIcon } from "@/components/brand/x-icon"
import {
  ScrollReveal,
  ScrollRevealGroup,
} from "@/components/landing/modern/scroll-reveal"
import { SectionHeader } from "@/components/landing/modern/sphere-ui"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  TESTIMONIALS_SECTION,
  X_POSTS,
  type XPost,
} from "@/lib/landing-modern-data"
import { LANDING_REVEAL } from "@/lib/landing-motion"
import { SOCIAL_X_URL } from "@/lib/site"
import {
  landingGlassSheen,
  landingGlassSurface,
  landingInner,
  landingSection,
  landingSectionBody,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function XPostCard({ post }: { post: XPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Read @${post.handle}'s post on X`}
      className={cn(
        landingGlassSurface,
        "group flex h-full flex-col rounded-[1.5rem] bg-white/42 px-5 py-5 sm:px-6 sm:py-6 dark:bg-white/8",
        "transition-shadow hover:shadow-[0_24px_64px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.92),inset_0_-1px_2px_rgba(255,255,255,0.28)] dark:hover:shadow-[0_24px_64px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)]"
      )}
    >
      <span
        aria-hidden
        className={cn(landingGlassSheen, "pointer-events-none absolute inset-0 rounded-[1.5rem]")}
      />

      <div className="relative z-10 flex items-start gap-3">
        <Avatar size="lg">
          <AvatarImage src={post.avatar} alt="" />
          <AvatarFallback>{post.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{post.name}</p>
          <p className="truncate text-xs text-muted-foreground">@{post.handle}</p>
        </div>
        <XIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
      </div>

      <p className="relative z-10 mt-4 flex-1 text-sm leading-relaxed whitespace-pre-line text-foreground/80">
        {post.text}
      </p>

      <p className="relative z-10 mt-5 text-xs text-muted-foreground">{post.date}</p>
    </a>
  )
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className={cn(landingSection, landingSectionBody)}>
      <div className={landingInner}>
        <ScrollReveal>
          <SectionHeader
            badge={TESTIMONIALS_SECTION.badge}
            title={TESTIMONIALS_SECTION.title}
            subtitle={TESTIMONIALS_SECTION.subtitle}
          />
        </ScrollReveal>

        <ScrollRevealGroup className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 md:grid-cols-3 lg:mt-14 lg:gap-5">
          {X_POSTS.map((post) => (
            <XPostCard key={post.id} post={post} />
          ))}
        </ScrollRevealGroup>

        <ScrollReveal delay={LANDING_REVEAL.stagger} className="mt-8 flex justify-center">
          <a
            href={SOCIAL_X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="size-3.5" />
            See more on X
          </a>
        </ScrollReveal>
      </div>
    </section>
  )
}
