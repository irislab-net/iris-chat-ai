import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import { cn } from "@/lib/utils"

/** Gemini dot mesh + orbs — same system as chat, clipped to the hero card. */
export function HeroLiquidGlassBg({
  /** `blue` pins the orb cycle to the brand hue instead of sweeping to teal/green. */
  tone,
}: {
  tone?: "blue"
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[2.5rem]"
    >
      <ChatMobileGeminiBackground
        variant="hero"
        visible
        active
        intro
        className={cn(tone === "blue" && "chat-gemini-bg-blue")}
      />
      <div className="absolute inset-0 bg-white/12 backdrop-blur-[1px] dark:bg-black/15" />
      <div className="absolute inset-x-[10%] top-0 h-px bg-linear-to-r from-transparent via-white to-transparent opacity-90 dark:via-white/40" />
    </div>
  )
}
