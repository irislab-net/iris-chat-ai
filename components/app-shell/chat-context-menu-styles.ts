/** iOS liquid-glass floating menus — account, history, and message actions.
 * Avoid `!` important utilities — they don't merge with DropdownMenu's
 * `bg-popover` / `rounded-lg` defaults and the opaque popover wins. */
const chatContextMenuContentClass =
  "z-50 w-auto min-w-[13.5rem] max-w-[min(100vw-1.5rem,17.5rem)] overflow-hidden rounded-2xl border-0 bg-white/78 p-1.5 text-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_12px_40px_-16px_color-mix(in_oklch,var(--foreground)_18%,transparent)] ring-0 backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/62 dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_12px_40px_-16px_color-mix(in_oklch,black_45%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.06]"

const chatContextMenuItemClass =
  "min-h-10 gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium tracking-[-0.01em] text-foreground focus:bg-foreground/[0.05] focus:text-foreground data-[highlighted]:bg-foreground/[0.05] dark:focus:bg-foreground/[0.08]"

const chatContextMenuIconClass = "size-4 shrink-0 text-muted-foreground"

const chatContextMenuDeleteClass =
  "min-h-10 gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-destructive focus:bg-destructive/10 focus:text-destructive data-[highlighted]:bg-destructive/10 [&_svg]:text-destructive!"

const chatContextMenuSeparatorClass =
  "-mx-0.5 my-1.5 h-px bg-foreground/[0.06] dark:bg-white/[0.08]"

const chatContextMenuHeaderClass =
  "px-2.5 py-2 text-sm font-normal leading-normal text-foreground"

const chatContextMenuSectionLabelClass =
  "px-2.5 pb-1 pt-1.5 text-[11px] font-medium tracking-[0.04em] text-muted-foreground"

export {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSectionLabelClass,
  chatContextMenuSeparatorClass,
}
