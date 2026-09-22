import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google"

/** LTR display + body on the marketing landing — single critical-path face. */
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  display: "swap",
  // Without this, Next injects a size-adjusted Arial fallback that covers
  // Arabic/Persian glyphs and blocks IRIS Sans (Vazirmatn) from ever applying.
  adjustFontFallback: false,
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-modern",
  display: "swap",
  preload: false,
})
