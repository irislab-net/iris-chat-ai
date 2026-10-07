import { redirect } from "next/navigation"

import { getLandingHref } from "@/lib/site"

/** Legacy path — landing is `/home` (exur.ai/home). */
export default function LegacyLandingRedirect() {
  redirect(getLandingHref())
}
