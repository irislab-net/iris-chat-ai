import { cn } from "@/lib/utils"

function AttentionPulseDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute flex size-2", className)}
    >
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-500 opacity-70" />
      <span className="relative inline-flex size-2 rounded-full bg-blue-600 ring-2 ring-background" />
    </span>
  )
}

export { AttentionPulseDot }
