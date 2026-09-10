"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ChatRenameDialogProps = {
  open: boolean
  value: string
  onValueChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

function ChatRenameDialog({
  open,
  value,
  onValueChange,
  onOpenChange,
  onSubmit,
}: ChatRenameDialogProps) {
  const t = useTranslations("workspace")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("renameChat")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="chat-rename-title">{t("renameChatLabel")}</Label>
          <Input
            id="chat-rename-title"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit()
            }}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancelRename")}
          </Button>
          <Button type="button" disabled={!value.trim()} onClick={onSubmit}>
            {t("saveRename")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ChatRenameDialog }
