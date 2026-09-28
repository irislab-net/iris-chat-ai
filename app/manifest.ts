import type { MetadataRoute } from "next"

import { BROWSER_CHROME_COLORS } from "@/lib/browser-chrome"
import { brandIconUrl } from "@/lib/brand-icons"
import { CHAT_APP_ORIGIN } from "@/lib/hosts"
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  const manifestUrl = `${CHAT_APP_ORIGIN}/manifest.webmanifest`

  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    // OS splash plate matches empty-hero / chrome light surface; in-app splash
    // (PwaSplash) then handles light/dark glass mark + name + dots.
    background_color: BROWSER_CHROME_COLORS.light,
    theme_color: BROWSER_CHROME_COLORS.light,
    lang: "en",
    prefer_related_applications: false,
    related_applications: [
      {
        platform: "webapp",
        url: manifestUrl,
      },
    ],
    icons: [
      {
        src: brandIconUrl("/favicon-48.png"),
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandIconUrl("/apple-touch-icon.png"),
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandIconUrl("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandIconUrl("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandIconUrl("/icon-512-maskable.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
