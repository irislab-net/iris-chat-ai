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
import {
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSectionLabelClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { WORKSPACE_PAGE_INFO, type WorkspacePageId } from "@/lib/workspace-page-info"
import { markWorkspacePageIntroSeen } from "@/lib/workspace-page-intro"
import { cn } from "@/lib/utils"

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
      <SheetContent side="bottom" className={chatMobileSheetContentClass}>
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={chatMobileSheetHeaderClass}>
          <SheetTitle className={chatMobileSheetTitleClass}>{info.title}</SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {info.summary}
          </SheetDescription>
        </SheetHeader>
        <div className={chatMobileSheetBodyClass}>
          <div className={chatMobileSheetCardClass}>
            <p className={chatMobileSheetSectionLabelClass}>Who it&apos;s for</p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
              {info.audience}
            </p>
          </div>
          <div>
            <p className={chatMobileSheetSectionLabelClass}>What you get</p>
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
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "px-5")}>
            <SheetClose
              render={
                <Button
                  type="button"
                  size="lg"
                  className={chatMobileSheetPrimaryButtonClass}
                >
                  Got it
                </Button>
              }
            />
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { WorkspacePageIntroSheet }
