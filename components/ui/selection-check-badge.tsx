import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Filled blue selection tick — menus, pickers, account preferences. */
const selectionCheckBadgeClass =
  "flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_1px_4px_rgba(37,99,235,0.4)]"

function SelectionCheckBadge({ className }: { className?: string }) {
  return (
    <span className={cn(selectionCheckBadgeClass, className)} aria-hidden>
      <CheckIcon className="size-3 stroke-[2.75]" />
    </span>
  )
}

/** Invisible spacer matching badge size when nothing is selected. */
function SelectionCheckSpacer({ className }: { className?: string }) {
  return <span className={cn("size-5 shrink-0", className)} aria-hidden />
}

export {
  SelectionCheckBadge,
  SelectionCheckSpacer,
  selectionCheckBadgeClass,
}
