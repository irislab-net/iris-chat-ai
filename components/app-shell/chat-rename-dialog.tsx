"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  chatMobileSheetBodyClass,
  chatMobileSheetContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetGhostButtonClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
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
import { cn } from "@/lib/utils"

type ChatRenameDialogProps = {
  open: boolean
  /** Current chat title — loaded into the field whenever the dialog opens. */
  title: string
  onOpenChange: (open: boolean) => void
  onSubmit: (nextTitle: string) => void
}

const RENAME_INPUT_ID = "chat-rename-title"

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
  const [draft, setDraft] = React.useState(title)
  const [draftSource, setDraftSource] = React.useState({ open, title })
  if (open && (draftSource.open !== open || draftSource.title !== title)) {
    setDraftSource({ open, title })
    setDraft(title)
  } else if (!open && draftSource.open) {
    setDraftSource({ open, title })
  }
  const canSave = Boolean(draft.trim())

  function handleSubmit() {
    const next = draft.trim()
    if (!next) return
    onSubmit(next)
    onOpenChange(false)
  }

  if (isDesktop === null) return null

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-[1.25rem] border border-border/40 bg-background p-0 shadow-xl ring-0 sm:max-w-[24rem]"
          showCloseButton
        >
          <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
            <DialogHeader className="gap-1 space-y-0 text-start">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {t("renameChat")}
              </DialogTitle>
            </DialogHeader>
            {open ? (
              <RenameFields
                value={draft}
                onValueChange={setDraft}
                onSubmit={handleSubmit}
                inputClassName="h-10 rounded-xl border-border/60 bg-background"
              />
            ) : null}
          </div>
          <DialogFooter className="mx-0 mb-0 gap-2 border-t border-border/40 p-4 pt-3.5 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              {t("cancelRename")}
            </Button>
            <Button
              type="button"
              className="rounded-full"
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
        <SheetHeader className={chatMobileSheetHeaderClass}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("renameChat")}
          </SheetTitle>
        </SheetHeader>
        <div className={cn(chatMobileSheetBodyClass, "pt-1")}>
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
          <div className={cn(chatMobileSheetFooterBarClass, "space-y-2")}>
            <Button
              type="button"
              disabled={!canSave}
              className={chatMobileSheetPrimaryButtonClass}
              onClick={handleSubmit}
            >
              {t("saveRename")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={chatMobileSheetGhostButtonClass}
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
