import type { MetadataRoute } from "next"

import { AI_CRAWLER_USER_AGENTS, SITE_URL } from "@/lib/seo"

const PUBLIC_DISALLOW = ["/auth/", "/v1/"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PUBLIC_DISALLOW,
      },
      {
        userAgent: [...AI_CRAWLER_USER_AGENTS],
        allow: "/",
        disallow: PUBLIC_DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: new URL(SITE_URL).host,
  }
}
