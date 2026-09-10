import { FlameIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function ProBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn(
        "gap-0.5 border-transparent bg-red-600 font-semibold tracking-wide text-white uppercase hover:bg-red-600 dark:bg-red-600 dark:text-white",
        className
      )}
    >
      <FlameIcon aria-hidden />
      Pro
    </Badge>
  )
}

export { ProBadge }
