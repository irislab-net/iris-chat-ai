import type { MetadataRoute } from "next"

import { buildSitemapEntries } from "@/lib/seo"

/** Regenerate hourly — desk data refreshes; landing is included too. */
export const revalidate = 3600

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries()
}
