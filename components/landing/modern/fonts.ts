import { Plus_Jakarta_Sans } from "next/font/google"

/**
 * LTR display + body on the marketing landing — single critical-path face.
 * Mono uses a CSS stack (`--font-mono-modern` in landing-modern.css) so Turbopack
 * does not fetch a second Google family (avoids flaky font module resolution).
 */
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  display: "swap",
  // Without this, Next injects a size-adjusted Arial fallback that covers
  // Arabic/Persian glyphs and blocks IRIS Sans (Vazirmatn) from ever applying.
  adjustFontFallback: false,
})
