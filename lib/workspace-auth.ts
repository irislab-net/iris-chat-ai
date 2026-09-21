import type { WorkspacePageId } from "@/lib/workspace-page-info"

/** Guest APIs return empty for these tabs — prompt sign-in instead of "no data". */
export function workspacePageRequiresAuth(_page: WorkspacePageId): boolean {
  return false
}

export type WorkspaceLoginCopy = {
  title: string
  description: string
}

export const WORKSPACE_LOGIN_COPY: Record<WorkspacePageId, WorkspaceLoginCopy> = {
  news: {
    title: "Sign in to read News",
    description:
      "Connect Google to load scored headlines, tape windows, and asset sentiment.",
  },
  iris: {
    title: "Sign in to use Exur",
    description:
      "Connect Google so the co-pilot can answer with fuller session context.",
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
