import type { WorkspacePageId } from "@/lib/workspace-page-info"

/** Guest APIs return empty for these tabs — prompt sign-in instead of "no data". */
export function workspacePageRequiresAuth(page: WorkspacePageId): boolean {
  return page === "intel"
}

export type WorkspaceLoginCopy = {
  title: string
  description: string
}

export const WORKSPACE_LOGIN_COPY: Record<WorkspacePageId, WorkspaceLoginCopy> = {
  desk: {
    title: "Sign in to open Desk",
    description:
      "Connect Google to load your workspace session and sync the trading desk.",
  },
  news: {
    title: "Sign in to read News",
    description:
      "Connect Google to load scored headlines, tape windows, and asset sentiment.",
  },
  intel: {
    title: "Sign in to view Intel",
    description:
      "Model distance, risk geometry, and classifier status need a signed-in session.",
  },
  iris: {
    title: "Sign in to use IRIS",
    description:
      "Connect Google so the co-pilot can answer with your desk context.",
  },
}

export function shouldShowWorkspaceLoginGate(
  page: WorkspacePageId,
  input: {
    isAuthenticated: boolean
    authLoading: boolean
    dataReady: boolean
    hasData: boolean
  }
) {
  if (!workspacePageRequiresAuth(page)) return false
  if (input.authLoading || !input.dataReady) return false
  if (input.isAuthenticated || input.hasData) return false
  return true
}
