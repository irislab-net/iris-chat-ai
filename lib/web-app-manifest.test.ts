import { describe, expect, it } from "vitest"

import { CHAT_APP_ORIGIN } from "@/lib/hosts"
import { SITE_NAME } from "@/lib/seo"
import { buildWebAppManifest, CHAT_PWA_ID } from "@/lib/web-app-manifest"

describe("buildWebAppManifest", () => {
  it("pins a stable absolute id on the chat origin", () => {
    expect(CHAT_PWA_ID).toBe(`${CHAT_APP_ORIGIN}/`)
    expect(buildWebAppManifest({ installable: true }).id).toBe(CHAT_PWA_ID)
    expect(buildWebAppManifest({ installable: false }).id).toBe(CHAT_PWA_ID)
  })

  it("makes only the chat desk standalone", () => {
    const chat = buildWebAppManifest({ installable: true })
    expect(chat.display).toBe("standalone")
    expect(chat.display_override).toEqual(["standalone", "minimal-ui"])
    expect(chat.name).toBe(SITE_NAME)
    expect(chat.related_applications?.[0]?.url).toBe(
      `${CHAT_APP_ORIGIN}/manifest.webmanifest`
    )
  })

  it("keeps marketing as a browser site, not a second installed app", () => {
    const marketing = buildWebAppManifest({ installable: false })
    expect(marketing.display).toBe("browser")
    expect(marketing.display_override).toBeUndefined()
  })
})
