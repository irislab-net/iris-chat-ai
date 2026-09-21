import { redirect } from "next/navigation"

import { getLandingHref } from "@/lib/site"

/** Legacy path — landing is `exur.ai/` (local preview: `/home`). */
export default function LegacyLandingRedirect() {
  redirect(getLandingHref())
}
