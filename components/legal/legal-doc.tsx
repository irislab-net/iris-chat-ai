import { Link } from "@/i18n/navigation"
import type { ReactNode } from "react"

import { AppShell } from "@/components/app-shell/app-shell"
import { Button } from "@/components/ui/button"
import { APP_NEWS_PATH, SITE_NAME } from "@/lib/site"
import { cn } from "@/lib/utils"

function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="mt-10 space-y-3" aria-labelledby={id}>
      <h2
        id={id}
        className="text-lg font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function LegalP({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  )
}

function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
      {children}
    </ul>
  )
}

function LegalOrderedList({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
      {children}
    </ol>
  )
}

function LegalDocShell({
  eyebrow,
  title,
  meta,
  intro,
  children,
  footerLinks,
}: {
  eyebrow?: string
  title: string
  meta: ReactNode
  intro: ReactNode
  children: ReactNode
  footerLinks?: ReactNode
}) {
  return (
    <AppShell defaultChatOpen={false}>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {eyebrow ?? SITE_NAME}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          {meta}
        </div>
        <div className="mt-4 space-y-3">{intro}</div>
        {children}
        {footerLinks ? (
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {footerLinks}
          </div>
        ) : null}
      </main>
    </AppShell>
  )
}

function LegalNavButtons({
  showTerms = true,
  showPrivacy = true,
}: {
  showTerms?: boolean
  showPrivacy?: boolean
}) {
  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="rounded-2xl"
        nativeButton={false}
        render={<Link href={APP_NEWS_PATH} />}
      >
        Launch App
      </Button>
      {showTerms ? (
        <Button
          variant="outline"
          size="lg"
          className="rounded-2xl"
          nativeButton={false}
          render={<Link href="/terms" />}
        >
          Terms of Service
        </Button>
      ) : null}
      {showPrivacy ? (
        <Button
          variant="outline"
          size="lg"
          className="rounded-2xl"
          nativeButton={false}
          render={<Link href="/privacy" />}
        >
          Privacy Policy
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="lg"
        className="rounded-2xl"
        nativeButton={false}
        render={<Link href="/about" />}
      >
        About Exur
      </Button>
    </>
  )
}

export {
  LegalDocShell,
  LegalList,
  LegalNavButtons,
  LegalOrderedList,
  LegalP,
  LegalSection,
}
