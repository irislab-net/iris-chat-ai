"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { WORKSPACE_PAGE_INFO, type WorkspacePageId } from "@/lib/workspace-page-info"
import { markWorkspacePageIntroSeen } from "@/lib/workspace-page-intro"

function WorkspacePageIntroSheet({
  page,
  open,
  onOpenChange,
}: {
  page: WorkspacePageId | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!page) return null
  const info = WORKSPACE_PAGE_INFO[page]
  const pageId = page

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) markWorkspacePageIntroSeen(pageId)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="gap-0 rounded-t-2xl border-0 bg-popover pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
      >
        <SheetHeader className="gap-2 pb-2 text-left">
          <SheetTitle>{info.title}</SheetTitle>
          <SheetDescription className="text-pretty leading-relaxed">
            {info.summary}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-2">
          <div className="rounded-2xl bg-muted/18 px-3 py-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Who it&apos;s for
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
              {info.audience}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              What you get
            </p>
            <ul className="mt-2 space-y-2">
              {info.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-2 text-sm leading-relaxed text-foreground/90"
                >
                  <span
                    aria-hidden
                    className="mt-2 size-1 shrink-0 rounded-full bg-foreground/35"
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <SheetFooter className="border-0 pt-2">
          <SheetClose
            render={
              <Button type="button" size="lg" className="h-11 w-full text-base">
                Got it
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { WorkspacePageIntroSheet }
