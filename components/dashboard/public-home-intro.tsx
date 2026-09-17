import { TryPaperTradingButton } from "@/components/dashboard/try-paper-trading-button"

/**
 * Server-rendered public homepage foundation (crawlable product identity).
 * Visually quiet — Market State is the primary hero (UI-01).
 */
function PublicHomeIntro() {
  return (
    <section
      aria-labelledby="iris-home-heading"
      className="shrink-0 px-5 pt-3 pb-2 md:px-7 md:pt-4 md:pb-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="mb-0.5 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Exur
          </p>
          <h1
            id="iris-home-heading"
            className="text-base font-medium tracking-tight text-muted-foreground md:text-lg"
          >
            Your AI financial assistant
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ask what’s going on, and what it means for you.
          </p>
        </div>
        <TryPaperTradingButton className="self-start sm:self-center" />
      </div>
    </section>
  )
}

export { PublicHomeIntro }
