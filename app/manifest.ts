import type { MetadataRoute } from "next"

import { isMarketingRequest } from "@/lib/request-host"
import { buildWebAppManifest } from "@/lib/web-app-manifest"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const marketing = await isMarketingRequest()
  return buildWebAppManifest({ installable: !marketing })
}
