"use client"

import type { LucideIcon } from "lucide-react"
import { CheckIcon, NewspaperIcon, SparklesIcon } from "lucide-react"

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
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { WORKSPACE_PAGE_INFO, type WorkspacePageId } from "@/lib/workspace-page-info"
import { markWorkspacePageIntroSeen } from "@/lib/workspace-page-intro"
import { cn } from "@/lib/utils"

const PAGE_ICONS: Record<WorkspacePageId, LucideIcon> = {
  iris: SparklesIcon,
  news: NewspaperIcon,
}

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
  const Icon = PAGE_ICONS[page]

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) markWorkspacePageIntroSeen(pageId)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          chatMobileSheetContentClass,
          "gap-0 bg-background/96 backdrop-blur-xl supports-backdrop-filter:bg-background/90"
        )}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />

        <SheetHeader className="items-center gap-0 space-y-0 p-0 px-6 pt-2 pb-0 text-center">
          <div
            aria-hidden
            className="relative mb-4 flex size-16 items-center justify-center"
          >
            <span className="absolute inset-0 rounded-[1.35rem] bg-primary/12 blur-md" />
            <span className="relative flex size-14 items-center justify-center rounded-[1.2rem] bg-gradient-to-b from-primary/15 to-primary/5 text-primary shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--primary)_22%,transparent)] ring-1 ring-primary/15">
              <Icon className="size-7" strokeWidth={1.5} />
            </span>
          </div>
          <SheetTitle
            className={cn(
              chatMobileSheetTitleClass,
              "text-[1.625rem] font-semibold leading-none tracking-[-0.03em]"
            )}
          >
            {info.title}
          </SheetTitle>
          <SheetDescription
            className={cn(
              chatMobileSheetDescriptionClass,
              "mx-auto mt-2.5 max-w-72 text-pretty text-sm leading-relaxed text-muted-foreground/90"
            )}
          >
            {info.summary}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-5 pb-1 pt-5">
          <div className="rounded-[1.25rem] bg-muted/45 px-4 py-3.5 ring-1 ring-border/40">
            <p className="text-xs font-medium tracking-[0.02em] text-muted-foreground">
              Best for
            </p>
            <p className="mt-1 text-[15px] leading-snug text-foreground/90">
              {info.audience}
            </p>
          </div>

          <ul className="overflow-hidden rounded-[1.25rem] ring-1 ring-border/50">
            {info.bullets.map((bullet, index) => (
              <li
                key={bullet}
                className={cn(
                  "flex items-start gap-3 bg-card/80 px-4 py-3.5",
                  index > 0 && "border-t border-border/40"
                )}
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <CheckIcon className="size-3" strokeWidth={2.5} />
                </span>
                <span className="text-[15px] leading-snug text-foreground/90">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <SheetFooter className={cn(chatMobileSheetFooterClass, "px-5 pt-5")}>
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { WorkspacePageIntroSheet }
