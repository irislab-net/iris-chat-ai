import { redirect } from "next/navigation"

import { LANDING_PATH } from "@/lib/site"

/** Legacy path — landing now lives at `/home`. */
export default function LegacyLandingRedirect() {
  redirect(LANDING_PATH)
}
