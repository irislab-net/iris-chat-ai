import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google"

export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-modern",
  display: "swap",
})
