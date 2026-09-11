import { redirect } from "next/navigation"

import {
  appPathWithTab,
  parseWorkspaceTab,
  WORKSPACE_TAB_NEWS,
} from "@/lib/workspace-tab"

/** Legacy path — desk now lives at `/`. */
export default async function LegacyAppRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const params = await searchParams
  const tabValue = Array.isArray(params.tab) ? params.tab[0] : params.tab
  const initialTab = parseWorkspaceTab(tabValue)
  if (!initialTab) {
    redirect(appPathWithTab(WORKSPACE_TAB_NEWS, params))
  }
  redirect(appPathWithTab(initialTab, params))
}
