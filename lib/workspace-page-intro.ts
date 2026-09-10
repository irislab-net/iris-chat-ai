import type { WorkspacePageId } from "@/lib/workspace-page-info"

const STORAGE_KEY = "iris-workspace-page-intro-v1"

function readSeenPages(): Partial<Record<WorkspacePageId, true>> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<Record<WorkspacePageId, true>>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeSeenPages(seen: Partial<Record<WorkspacePageId, true>>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
}

export function hasSeenWorkspacePageIntro(page: WorkspacePageId): boolean {
  return readSeenPages()[page] === true
}

export function markWorkspacePageIntroSeen(page: WorkspacePageId) {
  const seen = readSeenPages()
  if (seen[page]) return
  writeSeenPages({ ...seen, [page]: true })
}
