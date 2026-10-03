/**
 * Chat menu helpers — liquid glass now lives on DropdownMenu / ContextMenu defaults
 * (`components/ui/liquid-menu-styles.ts`). These re-exports keep call-site sizing
 * and row helpers stable.
 */
import {
  liquidMenuContentClass,
  liquidMenuIconClass,
  liquidMenuItemClass,
  liquidMenuItemDestructiveClass,
  liquidMenuLabelClass,
  liquidMenuSeparatorClass,
} from "@/components/ui/liquid-menu-styles"

/** @deprecated Prefer relying on DropdownMenuContent defaults; keep for min-width overrides. */
const chatContextMenuContentClass = liquidMenuContentClass

const chatContextMenuItemClass = liquidMenuItemClass

const chatContextMenuIconClass = liquidMenuIconClass

const chatContextMenuDeleteClass = [
  liquidMenuItemClass,
  liquidMenuItemDestructiveClass,
].join(" ")

const chatContextMenuSeparatorClass = liquidMenuSeparatorClass

const chatContextMenuHeaderClass =
  "px-3.5 py-3 text-[15px] font-normal leading-normal text-foreground"

const chatContextMenuSectionLabelClass = liquidMenuLabelClass

export {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSectionLabelClass,
  chatContextMenuSeparatorClass,
}
