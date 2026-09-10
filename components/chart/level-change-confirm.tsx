"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PendingLevelChange } from "@/lib/chart/trading-interactions"
import { slTpFieldLabel } from "@/lib/chart/trading-interactions"

type LevelChangeConfirmProps = {
  pending: PendingLevelChange | null
  onConfirm: () => void
  onCancel: () => void
}

function LevelChangeConfirm({ pending, onConfirm, onCancel }: LevelChangeConfirmProps) {
  return (
    <Dialog open={pending != null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update {pending ? slTpFieldLabel(pending.field) : "level"}?</DialogTitle>
          <DialogDescription>
            {pending ? (
              pending.valid ? (
                <>
                  Move {slTpFieldLabel(pending.field)} to{" "}
                  <span className="font-mono text-foreground">{pending.nextPrice.toFixed(2)}</span>{" "}
                  (projected PnL{" "}
                  <span
                    className={
                      pending.pnlUsd >= 0 ? "text-emerald-500" : "text-red-500"
                    }
                  >
                    {pending.pnlUsd >= 0 ? "+" : ""}
                    {pending.pnlUsd.toFixed(2)}
                  </span>
                  ). This updates order intent only — execution happens via the ticket.
                </>
              ) : (
                <>That price is invalid for the current side and entry.</>
              )
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!pending?.valid}
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { LevelChangeConfirm }
