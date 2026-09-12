import type { Metadata } from "next"
import Image from "next/image"
import { Link } from "@/i18n/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { TrackedContactLink } from "@/components/analytics/tracked-contact-link"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import {
  ABOUT_DESCRIPTION,
  getSiteOrigin,
  ROOT_ROBOTS,
  APP_NEWS_PATH,
  SITE_NAME,
  SOCIAL_X_URL,
} from "@/lib/site"

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESCRIPTION,
  robots: ROOT_ROBOTS,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/about",
    siteName: SITE_NAME,
    title: `About · ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `About · ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
  },
}

function AboutPage() {
  const origin = getSiteOrigin()
  const aboutPageLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE_NAME}`,
    url: `${origin}/about`,
    description: ABOUT_DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: origin,
    },
  }

  return (
    <AppShell defaultChatOpen={false}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <JsonLd data={aboutPageLd} />

        <header className="relative mb-10 min-h-88 overflow-hidden rounded-xl md:min-h-104">
          <div className="absolute inset-0" aria-hidden>
            <Image
              src="/home-bg-header.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 64rem"
              className="object-cover object-center invert dark:invert-0"
            />
            <div className="absolute inset-0 bg-background/55 dark:bg-background/50" />
          </div>
          <div className="relative z-10 flex min-h-88 items-end px-5 py-8 md:min-h-104  md:px-7 md:py-10">
            <div className="w-full max-w-md md:max-w-lg">
              <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {SITE_NAME}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                What is IRIS Lab?
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                IRIS Lab is a market-intel desk: public insight for the current
                candle, model context, news bullets (distilled headlines and
                summaries — not a raw wire), and an IRIS co-pilot you can talk
                to in plain language when you connect an account.
              </p>
            </div>
          </div>
        </header>

        <section className="mt-10 space-y-3" aria-labelledby="about-what">
          <h2
            id="about-what"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            What IRIS Lab is
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;re building a tool away from marketing theater — no slides,
            no empty promises, just the product. The homepage is the desk: pulse
            stance, model board, payoff geometry, and news bullets in one place,
            with IRIS AI available as a co-pilot for signed-in users.
          </p>
        </section>

        <section className="mt-10 space-y-3" aria-labelledby="about-public">
          <h2
            id="about-public"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Public market intelligence
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Guests can open the{" "}
            <Link
              href={APP_NEWS_PATH}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              public desk
            </Link>{" "}
            and see market pulse, insights, model context, and news bullets
            without signing in. Freshness labels use timestamps from the API —
            such as when an insight was generated or when a story was published
            — not login state. We do not treat authentication as proof of “live”
            or delayed data.
          </p>
        </section>

        <section className="mt-10 space-y-3" aria-labelledby="about-helps">
          <h2
            id="about-helps"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            How IRIS helps
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            IRIS organizes market information for the candle you&apos;re looking
            at: headline stance, how models sit relative to each other, payoff
            shape, and news bullets — short distilled stories with source
            context, not a raw news feed. The co-pilot is there to answer
            questions about that desk in plain English — support for analysis,
            not a substitute for your own judgment.
          </p>
        </section>

        <section className="mt-10 space-y-3" aria-labelledby="about-private">
          <h2
            id="about-private"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Private and member tools
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Connecting with Google unlocks account features such as co-pilot chat.
            Trade Desk and related premium guidance are treated as private /
            member capabilities when available — turn-by-turn desk guidance is
            the product direction, not brokerage order execution on this site.
            Public pages do not expose private account data for search engines.
          </p>
        </section>

        <section className="mt-10 space-y-3" aria-labelledby="about-trust">
          <h2
            id="about-trust"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Transparency
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Markets change. Timestamps describe when available content was
            generated or published. Insights and co-pilot replies are tools for
            analysis and decision-making — not guaranteed outcomes. Nothing on
            IRIS Lab promises profit, risk-free trades, or guaranteed accuracy.
          </p>
        </section>

        <section className="mt-10 space-y-4" aria-labelledby="about-hello">
          <h2
            id="about-hello"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Say hello
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Still curious? Reach us on X.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="h-auto gap-2 rounded-2xl border-0 px-4 py-3 shadow-none"
              render={
                <TrackedContactLink
                  href={SOCIAL_X_URL}
                  channel="x"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              X (Twitter)
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl"
              nativeButton={false}
              render={<Link href={APP_NEWS_PATH} />}
            >
              Launch App
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl"
              nativeButton={false}
              render={<Link href="/privacy" />}
            >
              Privacy Policy
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl"
              nativeButton={false}
              render={<Link href="/terms" />}
            >
              Terms of Service
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <TrackedContactLink
              href={SOCIAL_X_URL}
              channel="x"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {SOCIAL_X_URL}
            </TrackedContactLink>
            {" · "}
            <Link
              href="/privacy"
              className="underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            {" · "}
            <Link
              href="/terms"
              className="underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
          </p>
        </section>
      </main>
    </AppShell>
  )
}

export default AboutPage
