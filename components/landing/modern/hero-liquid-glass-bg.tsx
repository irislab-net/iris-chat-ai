import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"

/** Gemini dot mesh + orbs — same system as chat, clipped to the hero card. */
export function HeroLiquidGlassBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[2.5rem]"
    >
      <ChatMobileGeminiBackground variant="hero" visible active intro />
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
      <div className="absolute inset-x-[10%] top-0 h-px bg-linear-to-r from-transparent via-white to-transparent opacity-90" />
    </div>
  )
}
