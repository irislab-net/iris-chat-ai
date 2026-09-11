/** Gemini-style floating menus — shared by message, history, and account menus. */
const chatContextMenuContentClass =
  "w-auto min-w-[12.5rem] max-w-[min(100vw-1.5rem,17.5rem)] overflow-hidden !rounded-3xl border border-white/65 !bg-white/74 !p-2 !shadow-[0_14px_48px_-16px_rgba(15,23,42,0.24)] !ring-0 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:!bg-white/58 dark:border-white/10 dark:!bg-popover/84 dark:supports-[backdrop-filter]:!bg-popover/68 dark:!shadow-[0_16px_48px_-18px_rgba(0,0,0,0.55)]"

const chatContextMenuItemClass =
  "min-h-11 gap-3.5 rounded-2xl px-3.5 py-2.5 text-[15px] font-normal leading-none focus:bg-black/[0.04] focus:text-foreground dark:focus:bg-muted/40"

const chatContextMenuIconClass = "size-[18px] shrink-0 text-muted-foreground"

const chatContextMenuDeleteClass =
  "min-h-11 gap-3.5 rounded-2xl px-3.5 py-2.5 text-[15px] font-normal text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive!"

const chatContextMenuSeparatorClass = "-mx-0 my-1.5 h-px bg-black/[0.06] dark:bg-border/50"

const chatContextMenuHeaderClass =
  "px-3.5 py-2.5 text-[15px] font-normal leading-normal text-foreground"

export {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSeparatorClass,
}
