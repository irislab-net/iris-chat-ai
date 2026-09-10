/** Soft halo for the sliding active indicator — ring tint only, no fill. */
export const NAV_ACTIVE_GLOW_INDICATOR =
  "border-0 bg-transparent shadow-[0_0_22px_0px_color-mix(in_oklch,var(--ring)_30%,transparent),0_0_40px_6px_color-mix(in_oklch,var(--ring)_12%,transparent)]"

/** Filled pill for desktop workspace segmented nav. */
export const DESKTOP_WORKSPACE_NAV_ACTIVE_INDICATOR =
  "border border-border/80 bg-background shadow-sm ring-1 ring-foreground/8"

/** Matches `--mobile-app-nav-height` in `app/globals.css`. */
export const MOBILE_APP_NAV_HEIGHT = "var(--mobile-app-nav-height)"

/** Matches `--mobile-bottom-nav-clearance` in `app/globals.css`. */
export const MOBILE_BOTTOM_NAV_CLEARANCE =
  "var(--mobile-bottom-nav-clearance)"

/** Desk tabs + app nav — use when both fixed/stacked bottom bars apply. */
export const MOBILE_DESK_STACK_CLEARANCE =
  "var(--mobile-desk-stack-clearance)"

/** Matches `--mobile-desk-nav-height` in `app/globals.css`. */
export const MOBILE_DESK_NAV_HEIGHT = "var(--mobile-desk-nav-height)"
