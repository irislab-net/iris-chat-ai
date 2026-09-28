import { redirect } from "next/navigation"

import { APP_PATH } from "@/lib/site"

/** Legacy path — desk now lives at `/`. */
export default function LegacyAppRedirect() {
  redirect(APP_PATH)
}
