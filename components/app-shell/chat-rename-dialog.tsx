"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatDesktopDialogInputClass,
  chatMobileSheetBodyClass,
  chatMobileSheetContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type ChatRenameDialogProps = {
  open: boolean
  /**
   * Current chat title — loaded into the field whenever the dialog opens.
   * Accepts null/undefined because corrupted local history or sync stubs
   * can omit `title` at runtime (Sentry EXUR-FRONT-3).
   */
  title?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (nextTitle: string) => void
}

const RENAME_INPUT_ID = "chat-rename-title"

/** Keep draft state a real string so `.trim()` never throws. */
function normalizeRenameTitle(title: string | null | undefined): string {
  return typeof title === "string" ? title : ""
}

function RenameFields({
  value,
  onValueChange,
  onSubmit,
  inputClassName,
}: {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  inputClassName?: string
}) {
  const t = useTranslations("workspace")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [])

  return (
    <Input
      ref={inputRef}
      id={RENAME_INPUT_ID}
      value={value}
      placeholder={t("renameChatLabel")}
      aria-label={t("renameChatLabel")}
      onChange={(event) => onValueChange(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSubmit()
      }}
      autoComplete="off"
      className={inputClassName}
    />
  )
}

function ChatRenameDialog({
  open,
  title,
  onOpenChange,
  onSubmit,
}: ChatRenameDialogProps) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()
  const safeTitle = normalizeRenameTitle(title)
  const [draft, setDraft] = React.useState(safeTitle)
  const [draftSource, setDraftSource] = React.useState({
    open,
    title: safeTitle,
  })
  if (
    open &&
    (draftSource.open !== open || draftSource.title !== safeTitle)
  ) {
    setDraftSource({ open, title: safeTitle })
    setDraft(safeTitle)
  } else if (!open && draftSource.open) {
    setDraftSource({ open, title: safeTitle })
  }
  const trimmedDraft = normalizeRenameTitle(draft).trim()
  const canSave = trimmedDraft.length > 0

  function handleSubmit() {
    if (!trimmedDraft) return
    onSubmit(trimmedDraft)
    onOpenChange(false)
  }

  if (isDesktop === null) return null

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={chatDesktopDialogClass}
          showCloseButton
          gsapMotion
          open={open}
        >
          <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
            <DialogHeader className="gap-3 space-y-0 text-start">
              <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
                {t("renameChat")}
              </DialogTitle>
            </DialogHeader>
            {open ? (
              <RenameFields
                value={draft}
                onValueChange={setDraft}
                onSubmit={handleSubmit}
                inputClassName={chatDesktopDialogInputClass}
              />
            ) : null}
          </div>
          <DialogFooter className={chatDesktopDialogFooterClass}>
            <Button
              type="button"
              className={cn(landingCta("secondary", "sm"), "rounded-full")}
              onClick={() => onOpenChange(false)}
            >
              {t("cancelRename")}
            </Button>
            <Button
              type="button"
              className={cn(landingCta("primary", "sm"), "rounded-full")}
              disabled={!canSave}
              onClick={handleSubmit}
            >
              {t("saveRename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={chatMobileSheetContentClass}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-3")}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("renameChat")}
          </SheetTitle>
        </SheetHeader>
        <div className={cn(chatMobileSheetBodyClass, "pt-1 pb-5")}>
          {open ? (
            <RenameFields
              value={draft}
              onValueChange={setDraft}
              onSubmit={handleSubmit}
              inputClassName="h-12 rounded-2xl border-border/60 bg-card/75 px-4 text-base"
            />
          ) : null}
        </div>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "space-y-2 pt-4")}>
            <Button
              type="button"
              disabled={!canSave}
              className={cn(
                chatMobileSheetPrimaryButtonClass,
                "disabled:opacity-45"
              )}
              onClick={handleSubmit}
            >
              {t("saveRename")}
            </Button>
            <Button
              type="button"
              className={chatMobileSheetSecondaryButtonClass}
              onClick={() => onOpenChange(false)}
            >
              {t("cancelRename")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ChatRenameDialog }
