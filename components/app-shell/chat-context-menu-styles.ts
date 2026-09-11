/** Gemini-style floating menus — shared by message and history context menus. */
const chatContextMenuContentClass =
  "min-w-[12.5rem] rounded-3xl border border-border/30 bg-background/82 p-2 shadow-[0_12px_44px_-14px_rgba(15,23,42,0.24)] ring-0 backdrop-blur-2xl backdrop-saturate-150 dark:border-border/45 dark:bg-popover/90 dark:shadow-[0_16px_48px_-18px_rgba(0,0,0,0.55)]"

const chatContextMenuItemClass =
  "min-h-11 gap-3.5 rounded-2xl px-3.5 py-2.5 text-[15px] font-normal leading-none focus:bg-muted/65 dark:focus:bg-muted/40"

const chatContextMenuIconClass = "size-[18px] shrink-0 text-muted-foreground"

const chatContextMenuDeleteClass =
  "min-h-11 gap-3.5 rounded-2xl px-3.5 py-2.5 text-[15px] font-normal text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive!"

const chatContextMenuSeparatorClass = "my-1.5 bg-border/50"

const chatContextMenuHeaderClass = "px-3.5 py-2 font-normal"

export {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSeparatorClass,
}
