/** Soft glass floating menus — account, history, and message actions.
 * Pass after DropdownMenu defaults so glass/radius/padding win via twMerge.
 * Avoid `!` important utilities — they fight opaque `bg-popover` instead of replacing it.
 *
 * Radius: shell rounded-[28px]; nested rows rounded-2xl.
 */
const chatContextMenuContentClass = [
  "z-50 w-auto min-w-[13.5rem] max-w-[min(100vw-1.5rem,18rem)]",
  "flex flex-col gap-1 overflow-hidden rounded-[28px] border-0 p-2.5",
  "bg-white/55 text-foreground shadow-none ring-0",
  "shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_90%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_7%,transparent),0_18px_52px_-18px_color-mix(in_oklch,var(--foreground)_20%,transparent)]",
  "backdrop-blur-2xl backdrop-saturate-[180%]",
  "supports-backdrop-filter:bg-white/40",
  "dark:bg-[oklch(0.22_0_0_/0.82)]",
  "dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_12%,transparent),inset_0_0_0_1px_color-mix(in_oklch,white_8%,transparent),0_20px_56px_-18px_color-mix(in_oklch,black_55%,transparent)]",
  "dark:supports-backdrop-filter:bg-[oklch(0.2_0_0_/0.62)]",
  "origin-(--transform-origin) duration-220 ease-[cubic-bezier(0.22,1,0.36,1)]",
  "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-top-1",
  "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
].join(" ")

const chatContextMenuItemClass = [
  "min-h-12 gap-3 rounded-2xl px-3.5 py-3",
  "text-[15px] font-medium tracking-[-0.016em] text-foreground",
  "transition-colors duration-150",
  "focus:bg-[rgba(118,118,128,0.12)] focus:text-foreground",
  "data-highlighted:bg-[rgba(118,118,128,0.12)]",
  "dark:focus:bg-[rgba(118,118,128,0.24)] dark:data-highlighted:bg-[rgba(118,118,128,0.24)]",
].join(" ")

const chatContextMenuIconClass = "size-4.5 shrink-0 text-muted-foreground"

const chatContextMenuDeleteClass = [
  "min-h-12 gap-3 rounded-2xl px-3.5 py-3",
  "text-[15px] font-medium text-destructive",
  "transition-colors duration-150",
  "focus:bg-[rgba(255,59,48,0.12)] focus:text-destructive",
  "data-highlighted:bg-[rgba(255,59,48,0.12)]",
  "dark:focus:bg-[rgba(255,69,58,0.18)] dark:data-highlighted:bg-[rgba(255,69,58,0.18)]",
  "[&_svg]:text-destructive!",
].join(" ")

const chatContextMenuSeparatorClass =
  "-mx-0.5 my-1.5 h-px bg-foreground/7 dark:bg-white/10"

const chatContextMenuHeaderClass =
  "px-3.5 py-3 text-[15px] font-normal leading-normal text-foreground"

const chatContextMenuSectionLabelClass =
  "px-3.5 pb-1.5 pt-2 text-[11px] font-medium tracking-[0.006em] text-muted-foreground"

export {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSectionLabelClass,
  chatContextMenuSeparatorClass,
}
