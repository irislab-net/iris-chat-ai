import type { MetadataRoute } from "next"

import { BROWSER_CHROME_COLORS } from "@/lib/browser-chrome"
import { brandIconUrl } from "@/lib/brand-icons"
import { CHAT_APP_ORIGIN } from "@/lib/hosts"
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "@/lib/seo"

/** Stable PWA identity — never tie this to `start_url` or a host-relative slash. */
export const CHAT_PWA_ID = `${CHAT_APP_ORIGIN}/`

const CHAT_MANIFEST_URL = `${CHAT_APP_ORIGIN}/manifest.webmanifest`

const MANIFEST_ICONS: MetadataRoute.Manifest["icons"] = [
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
]

/**
 * Chat desk is the installable app. Marketing (exur.ai) stays `browser`
 * so Chrome does not offer a second standalone install of the landing site.
 */
export function buildWebAppManifest(options: {
  installable: boolean
}): MetadataRoute.Manifest {
  const shared: MetadataRoute.Manifest = {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    id: CHAT_PWA_ID,
    lang: "en",
    prefer_related_applications: false,
    related_applications: [
      {
        platform: "webapp",
        url: CHAT_MANIFEST_URL,
      },
    ],
    // OS splash plate matches empty-hero / chrome light surface; in-app splash
    // (PwaSplash) then handles light/dark glass mark + name + dots.
    background_color: BROWSER_CHROME_COLORS.light,
    theme_color: BROWSER_CHROME_COLORS.light,
    icons: MANIFEST_ICONS,
  }

  if (options.installable) {
    return {
      ...shared,
      display: "standalone",
      display_override: ["standalone", "minimal-ui"],
    }
  }

  return {
    ...shared,
    display: "browser",
  }
}
