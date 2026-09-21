import { redirect } from "next/navigation"

import { LANDING_PATH } from "@/lib/site"

/** Legacy path — landing is `/home` internally; production apex rewrites `/` → `/home`. */
export default function LegacyLandingRedirect() {
  redirect(LANDING_PATH)
}
