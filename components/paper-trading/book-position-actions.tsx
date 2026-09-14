"use client"

import * as React from "react"
import {
  CopyIcon,
  MoreVerticalIcon,
  RouteIcon,
  SparklesIcon,
  TargetIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { dispatchCopilotChatPrefill, dispatchCopilotTradeTrace } from "@/lib/paper-trading/copilot-client"
import {
  buildClosedTradeChatPrompt,
  buildClosedTradeTracePrompt,
  buildClosedTradeClipboardSummary,
  buildPositionChatPrompt,
  buildPositionClipboardSummary,
  copyTextToClipboard,
} from "@/lib/paper-trading/position-chat-prompt"
import { requestOpenPaperTrading } from "@/lib/paper-trading/open-request"
import type { ClosedTrade, Position } from "@/lib/trading/types"
import { decimalNumber } from "@/lib/trading/types"
import { cn } from "@/lib/utils"

function askIris(text: string) {
  dispatchCopilotChatPrefill({
    text,
    openChat: true,
    focus: true,
  })
}

type PositionMenuParts = {
  Item: typeof ContextMenuItem | typeof DropdownMenuItem
  Label: typeof ContextMenuLabel | typeof DropdownMenuLabel
  Group: typeof ContextMenuGroup | typeof DropdownMenuGroup
  Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator
}

function traceClosedTradeWithAi(trade: ClosedTrade) {
  dispatchCopilotTradeTrace({
    symbol: trade.symbol,
    side: trade.side,
    entryPrice: decimalNumber(trade.entryPrice),
    exitPrice: decimalNumber(trade.exitPrice),
    openedAt: trade.openedAt,
    closedAt: trade.closedAt,
    reason: trade.reason,
    realizedPnl: decimalNumber(trade.realizedPnl),
  })
  requestOpenPaperTrading()
  askIris(buildClosedTradeTracePrompt(trade))
}

function TraceWithAiMenuItem({
  Item,
  trade,
}: {
  Item: PositionMenuParts["Item"]
  trade: ClosedTrade
}) {
  return (
    <Item
      className="whitespace-nowrap text-xs"
      onClick={() => traceClosedTradeWithAi(trade)}
    >
      <RouteIcon className="size-3.5" />
      Trace with AI
    </Item>
  )
}

function PositionActionMenuItems({
  position,
  mark,
  readOnly,
  onSelect,
  onClose,
  parts,
}: {
  position: Position
  mark: number
  readOnly?: boolean
  onSelect?: (id: string) => void
  onClose?: (id: string) => void
  parts: PositionMenuParts
}) {
  const { Item, Label, Group, Separator } = parts

  return (
    <>
      <Group>
        <Label className="font-mono text-[10px] uppercase tracking-wide">
          {position.symbol} · {position.side}
        </Label>
        <Item onClick={() => askIris(buildPositionChatPrompt(position, mark))}>
          <SparklesIcon />
          Ask Exur
        </Item>
        {!readOnly && onSelect ? (
          <Item onClick={() => onSelect(position.id)}>
            <TargetIcon />
            Edit TP/SL
          </Item>
        ) : null}
        <Item
          onClick={() =>
            void copyTextToClipboard(
              buildPositionClipboardSummary(position, mark)
            )
          }
        >
          <CopyIcon />
          Copy details
        </Item>
      </Group>
      {!readOnly && onClose ? (
        <>
          <Separator />
          <Group>
            <Item variant="destructive" onClick={() => onClose(position.id)}>
              <XIcon />
              Close position
            </Item>
          </Group>
        </>
      ) : null}
    </>
  )
}

const contextMenuParts: PositionMenuParts = {
  Item: ContextMenuItem,
  Label: ContextMenuLabel,
  Group: ContextMenuGroup,
  Separator: ContextMenuSeparator,
}

const dropdownMenuParts: PositionMenuParts = {
  Item: DropdownMenuItem,
  Label: DropdownMenuLabel,
  Group: DropdownMenuGroup,
  Separator: DropdownMenuSeparator,
}

function PositionIrisButton({
  position,
  mark,
  className,
  size = "icon-xs",
}: {
  position: Position
  mark: number
  className?: string
  size?: "icon-xs" | "icon-sm"
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size={size}
            variant="ghost"
            className={cn(
              "shrink-0 text-muted-foreground hover:text-foreground",
              className
            )}
            aria-label="Ask Exur about this position"
            onClick={(event) => {
              event.stopPropagation()
              askIris(buildPositionChatPrompt(position, mark))
            }}
          >
            <SparklesIcon className="size-3.5" />
          </Button>
        }
      />
      <TooltipContent side="top">Ask Exur</TooltipContent>
    </Tooltip>
  )
}

function PositionTpslButton({
  selected,
  onSelect,
  className,
  size = "icon-xs",
}: {
  selected?: boolean
  onSelect: () => void
  className?: string
  size?: "icon-xs" | "icon-sm"
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size={size}
            variant={selected ? "secondary" : "outline"}
            className={cn("shrink-0", className)}
            aria-label="Edit TP/SL"
            onClick={(event) => {
              event.stopPropagation()
              onSelect()
            }}
          >
            <TargetIcon className="size-3.5" />
          </Button>
        }
      />
      <TooltipContent side="top">Edit TP/SL</TooltipContent>
    </Tooltip>
  )
}

function PositionCloseButton({
  onClose,
  className,
  size = "icon-xs",
}: {
  onClose: () => void
  className?: string
  size?: "icon-xs" | "icon-sm"
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size={size}
            variant="ghost"
            className={cn(
              "shrink-0 text-destructive hover:text-destructive",
              className
            )}
            aria-label="Close position"
            onClick={(event) => {
              event.stopPropagation()
              onClose()
            }}
          >
            <XIcon className="size-3.5" />
          </Button>
        }
      />
      <TooltipContent side="top">Close position</TooltipContent>
    </Tooltip>
  )
}

function PositionMoreMenu({
  position,
  mark,
  readOnly,
  onSelect,
  onClose,
  className,
  size = "icon-xs",
}: {
  position: Position
  mark: number
  readOnly?: boolean
  onSelect?: (id: string) => void
  onClose?: (id: string) => void
  className?: string
  size?: "icon-xs" | "icon-sm"
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size={size}
            variant="ghost"
            className={cn(
              "shrink-0 text-muted-foreground hover:text-foreground",
              className
            )}
            aria-label="More position actions"
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        <MoreVerticalIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-40"
        onClick={(event) => event.stopPropagation()}
      >
        <PositionActionMenuItems
          position={position}
          mark={mark}
          readOnly={readOnly}
          onSelect={onSelect}
          onClose={onClose}
          parts={dropdownMenuParts}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PositionContextMenu({
  position,
  mark,
  readOnly,
  onSelect,
  onClose,
  trigger,
}: {
  position: Position
  mark: number
  readOnly?: boolean
  onSelect?: (id: string) => void
  onClose?: (id: string) => void
  trigger: React.ReactElement
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={trigger} />
      <ContextMenuContent className="min-w-40">
        <PositionActionMenuItems
          position={position}
          mark={mark}
          readOnly={readOnly}
          onSelect={onSelect}
          onClose={onClose}
          parts={contextMenuParts}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

function ClosedTradeContextMenu({
  trade,
  trigger,
}: {
  trade: ClosedTrade
  trigger: React.ReactElement
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={trigger} />
      <ContextMenuContent className="min-w-40">
        <ContextMenuGroup>
          <ContextMenuLabel className="font-mono text-[10px] uppercase tracking-wide">
            {trade.symbol} · {trade.side}
          </ContextMenuLabel>
          <ContextMenuItem
            onClick={() => askIris(buildClosedTradeChatPrompt(trade))}
          >
            <SparklesIcon />
            Ask Exur
          </ContextMenuItem>
        <TraceWithAiMenuItem Item={ContextMenuItem} trade={trade} />
          <ContextMenuItem
            onClick={() =>
              void copyTextToClipboard(buildClosedTradeClipboardSummary(trade))
            }
          >
            <CopyIcon />
            Copy details
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export {
  ClosedTradeContextMenu,
  PositionCloseButton,
  PositionContextMenu,
  PositionIrisButton,
  PositionMoreMenu,
  PositionTpslButton,
}
