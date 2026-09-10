"use client"

import { TicketSlotOutlet, useTicketSlot } from "@/components/app-shell/ticket-slot"
import { TicketAsideSkeleton } from "@/components/app-shell/shell-skeletons"
import { AnalysisAsideSkeleton } from "@/components/dashboard/intel-skeletons"
import { cn } from "@/lib/utils"

type TicketAsideProps = {
  className?: string
  variant?: "ticket" | "analysis"
}

function TicketAside({ className, variant = "ticket" }: TicketAsideProps) {
  const slot = useTicketSlot()
  return (
    <aside
      data-slot="ticket-aside"
      data-tour="ticket"
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {slot?.occupied ? null : (
        <div className="absolute inset-0">
          {variant === "analysis" ? (
            <AnalysisAsideSkeleton />
          ) : (
            <TicketAsideSkeleton />
          )}
        </div>
      )}
      <TicketSlotOutlet className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden" />
    </aside>
  )
}

export { TicketAside }
