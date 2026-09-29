/**
 * Apple system fills (UIColor) — overlay on existing backgrounds.
 * Light: fill 20% · secondary 16% · tertiary 12% · quaternary 8%
 * Dark:  fill 36% · secondary 32% · tertiary 24% · quaternary 18%
 * Hover content → tertiary · Pressed → quaternary · Selected → soft secondary
 * Glass chrome hover → brighter frost + stronger specular (iOS 26 .interactive)
 */
const chatHoverFillClass =
  "hover:bg-[rgba(118,118,128,0.12)] dark:hover:bg-[rgba(118,118,128,0.24)]"
const chatPressFillClass =
  "active:bg-[rgba(116,116,128,0.08)] dark:active:bg-[rgba(116,116,128,0.18)]"
const chatActiveFillClass =
  "bg-[rgba(120,120,128,0.14)] dark:bg-[rgba(120,120,128,0.28)]"

/** iOS 26 liquid glass — translucent frost + hairline rim + specular depth (Apple Tahoe). */
const chatMobileGlassSurfaceClass =
  "chat-ios26-liquid-glass relative isolate border border-white/35 bg-white/[0.18] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.72),inset_0_0_0_0.5px_rgba(255,255,255,0.35),inset_0_-10px_18px_-12px_rgba(0,0,0,0.14),0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-12px_rgba(0,0,0,0.14)] backdrop-blur-[22px] backdrop-saturate-[190%] supports-[backdrop-filter]:bg-white/[0.12] dark:border-white/16 dark:bg-white/[0.10] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_-12px_22px_-12px_rgba(0,0,0,0.5),0_8px_28px_-12px_rgba(0,0,0,0.42)] dark:supports-[backdrop-filter]:bg-white/[0.07]"

/**
 * Composer shell — iOS 26 `.regular` Liquid Glass (same family as search bar).
 * Rest: translucent frost (~18–22%), blur + saturate, specular rim.
 * Focus: slightly denser for typing legibility (still glass, not opaque card).
 * Dark: keep blur — never solid opaque (cardinal: glass stays material).
 * Soft blue outer glow — brand tint, very low opacity lift under the capsule.
 */
const chatMobileComposerGlassClass =
  "chat-ios26-liquid-glass relative isolate border border-white/35 bg-white/[0.22] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75),inset_0_0_0_0.5px_rgba(255,255,255,0.4),inset_0_-8px_16px_-12px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.03),0_-6px_20px_-6px_rgba(37,99,235,0.12),0_-14px_40px_-12px_rgba(37,99,235,0.10),0_4px_14px_-10px_rgba(37,99,235,0.05)] backdrop-blur-[22px] backdrop-saturate-[190%] supports-[backdrop-filter]:bg-white/[0.14] dark:border-white/16 dark:bg-white/[0.12] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_-10px_20px_-12px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.2),0_-8px_24px_-6px_rgba(37,99,235,0.16),0_-18px_44px_-14px_rgba(37,99,235,0.12),0_4px_16px_-12px_rgba(37,99,235,0.06)] dark:supports-[backdrop-filter]:bg-white/[0.08]"

const chatMobileComposerGlassFocusClass =
  "focus-within:border-white/50 focus-within:bg-white/[0.36] focus-within:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.88),inset_0_0_0_0.5px_rgba(255,255,255,0.5),inset_0_-8px_16px_-12px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.04),0_-8px_24px_-6px_rgba(37,99,235,0.16),0_-18px_48px_-12px_rgba(37,99,235,0.12),0_4px_14px_-10px_rgba(37,99,235,0.06)] supports-[backdrop-filter]:focus-within:bg-white/[0.22] dark:focus-within:border-white/24 dark:focus-within:bg-white/[0.18] dark:focus-within:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_0_0_0.5px_rgba(255,255,255,0.18),inset_0_-10px_20px_-12px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.22),0_-10px_28px_-6px_rgba(37,99,235,0.2),0_-20px_52px_-14px_rgba(37,99,235,0.14),0_4px_16px_-12px_rgba(37,99,235,0.07)] dark:supports-[backdrop-filter]:focus-within:bg-white/[0.12]"

/**
 * Primary / prominent — iOS 26 `.regular.tint(.blue).interactive()`:
 * capsule · tinted glass (not flat opaque) · specular insets · press 0.96 · ≥44pt.
 */
const chatLandingAccentFillClass =
  "border-0 bg-[#2563EB]/88 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.42),inset_0_-1px_2px_rgba(29,78,216,0.28),0_4px_16px_-4px_rgba(37,99,235,0.28)] backdrop-blur-xl backdrop-saturate-[180%] transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-[#2563EB]/96 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(29,78,216,0.32),0_6px_20px_-4px_rgba(37,99,235,0.36)] active:scale-[0.96]"

const chatMobilePrimaryButtonClass = chatLandingAccentFillClass

/** Secondary / quiet tint — soft blue fill (chip, idle send). */
const chatAccentSecondaryFillClass =
  "border-0 bg-[#2563EB]/12 text-[#1D4ED8] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),0_1px_2px_rgba(37,99,235,0.08)] backdrop-blur-md backdrop-saturate-[160%] transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-[#2563EB]/18 active:scale-[0.96] dark:bg-[#2563EB]/22 dark:text-[#93C5FD] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_1px_2px_rgba(37,99,235,0.16)] dark:hover:bg-[#2563EB]/28"

/** Rest-state lift lives on the glass surface; keep token for compositions. */
const chatMobileHeaderShadowClass = ""

/**
 * Glass chrome hover — iOS 26 `.interactive()`:
 * brighter frost (white ~32%), stronger rim/specular, soft lift; press scale 0.96.
 */
const chatMobileHeaderShadowHoverClass =
  "hover:border-white/55 hover:bg-white/[0.32] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-8px_16px_-12px_rgba(0,0,0,0.1),0_2px_8px_-2px_rgba(0,0,0,0.06),0_12px_28px_-12px_rgba(0,0,0,0.16)] dark:hover:border-white/28 dark:hover:bg-white/[0.18] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.38),inset_0_0_0_0.5px_rgba(255,255,255,0.2),inset_0_-10px_20px_-12px_rgba(0,0,0,0.45),0_10px_28px_-10px_rgba(0,0,0,0.48)]"

const chatMobileHeaderCircleClass = `rounded-full ${chatMobileGlassSurfaceClass} text-foreground transition-[transform,background-color,box-shadow,border-color] duration-150 ease-out active:scale-[0.96]`

/**
 * Nav-bar glass icon button — iOS 26 / HIG:
 * 44×44 pt hit target, ~22 pt symbol, ~11 pt optical padding.
 */
const chatMobileHeaderButtonClass = `size-11 shrink-0 ${chatMobileHeaderCircleClass} ${chatMobileHeaderShadowHoverClass} [&_svg:not([class*='size-'])]:size-[22px] [&_svg]:stroke-[1.7]`

/** Desktop sidebar glass icon — matches history rail (36×36, 16 pt symbol). */
const chatDesktopSidebarIconButtonClass = `size-9 shrink-0 ${chatMobileHeaderCircleClass} ${chatMobileHeaderShadowHoverClass} [&_svg:not([class*='size-'])]:size-4 [&_svg]:stroke-[1.75]`

const chatMobileHeaderNewChatClass = chatMobileHeaderButtonClass

/** Trailing account control — 48 pt primary target (HIG recommended). */
const chatMobileHeaderAvatarButtonClass = `flex size-12 shrink-0 items-center justify-center overflow-visible p-0 ${chatMobileHeaderCircleClass} ${chatMobileHeaderShadowHoverClass}`

const chatMobileHeaderAvatarClass = "size-10 after:border-0 ring-0"

const chatMobileHeaderPlanBadgeClass =
  "h-3.5 translate-y-[48%] px-1.5 text-[8px] font-semibold shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_8%,transparent)]"

/** Glass capsule (effort / chips) — same 44 pt height as icon buttons, 16 pt side inset. */
const chatMobileHeaderModelClass = `inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-medium tracking-[-0.015em] text-foreground ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowHoverClass} transition-[transform,background-color,box-shadow,border-color] active:scale-[0.98] [&_svg:not([class*='size-'])]:size-[18px] [&_svg]:opacity-65 [&_svg]:text-foreground`

const chatMobileHeaderModelPrimaryClass = "text-foreground"

const chatMobileHeaderModelSecondaryClass = "text-muted-foreground"

/** Empty hero — vertical padding clears absolute header + raised composer dock. */
const chatMobileEmptyHeroWrapClass =
  "flex min-h-full flex-col items-center justify-center px-6 pt-[max(5.5rem,calc(var(--app-safe-top)+4.25rem))] pb-[calc(9rem+env(safe-area-inset-bottom,0px))]"

const chatMobileEmptyHeroContentClass =
  "chat-empty-hero flex flex-col items-center gap-5 text-center"

const chatMobileEmptyHeroMarkClass = "chat-empty-hero-mark"

const chatMobileEmptyHeroTitleClass =
  "chat-empty-hero-title max-w-[20rem] text-balance text-[28px] font-light leading-8.5 tracking-[0.01em] text-foreground"

const chatMobileThreadClass = "px-6 pt-6 pb-6"

/**
 * Top clearance — safe-area + header controls (40px) + room past the header
 * scrim so the first turn never sits under the heading chrome.
 */
const chatMobileThreadTopSpacerClass =
  "app-mobile-safe-header pointer-events-none h-10 shrink-0 pb-14"

/** Extra breathing room below the header fade for the first turn. */
const chatMobileThreadFirstTurnClass = "mt-4 sm:mt-5"

/**
 * Scroll tail — clears floating composer (pill + shell padding + safe-area)
 * with extra air so the last turn can scroll fully above the dock.
 */
const chatMobileThreadBottomSpacerClass =
  "h-[calc(8.75rem+env(safe-area-inset-bottom,0px))] shrink-0"

/** Soft scroll fades — content dissolves under absolute header + composer. */
const chatMobileThreadScrollMaskClass =
  "[&_[data-slot=scroll-area-viewport]]:mask-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.45)_3%,rgba(0,0,0,0.85)_7%,black_12%,black_78%,rgba(0,0,0,0.8)_88%,rgba(0,0,0,0.4)_95%,transparent_100%)] [&_[data-slot=scroll-area-viewport]]:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.45)_3%,rgba(0,0,0,0.85)_7%,black_12%,black_78%,rgba(0,0,0,0.8)_88%,rgba(0,0,0,0.4)_95%,transparent_100%)]"

/** Bottom blur + fade overlay — strip behind floating composer. */
const chatMobileThreadBottomFadeClass =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-background/80 from-0% via-background/35 via-40% to-transparent to-100% backdrop-blur-[6px] backdrop-saturate-150 [mask-image:linear-gradient(to_top,black_0%,black_28%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,black_28%,transparent_100%)] supports-[backdrop-filter]:from-background/55 supports-[backdrop-filter]:via-background/15 supports-[backdrop-filter]:to-transparent"

/**
 * Header overlay shell — floats over the thread (Gemini absolute chrome).
 * Scrim is sized to the header box and extends below for the fade.
 */
const chatMobileHeaderShellClass = "absolute inset-x-0 top-0 z-20"

/**
 * Soft header fade — mostly transparent so thread text ghosts under the
 * glass controls (Gemini), solid only near the very top edge.
 */
const chatMobileHeaderScrimClass =
  "pointer-events-none absolute inset-x-0 top-0 -bottom-12 z-0 bg-gradient-to-b from-background/70 from-0% via-background/25 via-45% to-transparent to-100% backdrop-blur-md backdrop-saturate-150 [mask-image:linear-gradient(to_bottom,black_0%,black_42%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_42%,transparent_100%)] supports-[backdrop-filter]:from-background/45 supports-[backdrop-filter]:via-background/12 supports-[backdrop-filter]:to-transparent dark:from-background/75 dark:via-background/30 dark:supports-[backdrop-filter]:from-background/55 dark:supports-[backdrop-filter]:via-background/18"

/** Floating composer dock — absolute over the thread bottom. */
const chatMobileComposerDockClass =
  "absolute inset-x-0 bottom-0 z-20 mx-auto w-full bg-transparent"

/**
 * Soft corner scale:
 * nested/row = rounded-2xl (16) · bubble/card/composer = rounded-3xl (24) · sheet = 28
 */

/** User bubble. */
const chatMobileUserBubbleClass =
  "w-full rounded-3xl border-0 bg-[#F9F9F9] px-5 py-3.5 text-[16px] font-normal leading-[1.45] tracking-normal text-foreground shadow-none dark:bg-secondary dark:text-secondary-foreground"

const chatMobileUserBubbleInteractiveClass = `${chatMobileUserBubbleClass} outline-none transition-colors duration-150 hover:bg-[#F5F5F5] focus-within:bg-[#F5F5F5] dark:hover:bg-secondary/90 dark:focus-within:bg-secondary/90`

/** Assistant prose shell — Gemini Answer Body; AIMessageRenderer owns detailed type. */
const chatMobileAssistantClass =
  "text-[16px] font-normal leading-[1.55] tracking-normal text-foreground [&_p]:mb-3 [&_p:last-child]:mb-0"

const chatMobileComposerShellClass =
  "relative shrink-0 bg-transparent px-6 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))]"

/** Floating composer — pill when single-line. */
const chatMobileComposerPillClass = `grid rounded-full text-foreground transition-[box-shadow,background-color,border-color] duration-200 ease-out ${chatMobileComposerGlassClass} ${chatMobileComposerGlassFocusClass}`

/** Compact — taller bar → larger circular ends (rounder pill). */
const chatMobileComposerPillCompactClass =
  "min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-4 py-2 [grid-template-areas:'leading_field_trailing']"

/** Multiline — soft card radius. */
const chatMobileComposerPillExpandedClass =
  "min-h-0 w-full rounded-3xl grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-end gap-x-0.5 gap-y-0.5 px-2.5 py-2.5 [grid-template-areas:'field_field_field'_'leading_._trailing']"

const chatMobileComposerLeadingClass =
  "[grid-area:leading] flex h-11 min-w-0 items-center gap-1"

const chatMobileComposerTrailingClass =
  "[grid-area:trailing] flex h-11 shrink-0 items-center justify-end"

const chatMobileComposerTextareaClass =
  "chat-bidi w-full min-w-0 flex-1 field-sizing-content resize-none rounded-none border-0 bg-transparent px-2.5 text-[16px] font-normal leading-[1.4] tracking-normal break-words text-foreground shadow-none placeholder:text-muted-foreground/45 focus-visible:border-transparent focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-100 dark:bg-transparent dark:disabled:bg-transparent dark:placeholder:text-muted-foreground/40"

const chatMobileComposerTextareaCompactClass =
  "h-11 min-h-11 max-h-11 w-full self-center py-0 overflow-hidden leading-11 [field-sizing:fixed]"

const chatMobileComposerTextareaExpandedClass =
  "min-h-10 max-h-40 py-2.5 overflow-y-auto"

/** Desktop/web composer — liquid glass rim lives in the composer glass shadows. */
const chatDesktopComposerGlassBorderClass = "ring-0"

/** Desktop chat canvas — soft system gray so white cards/composer lift off the surface. */
const chatDesktopCanvasClass =
  "bg-[#F2F2F7] text-foreground dark:bg-background"

const chatDesktopComposerShellClass =
  "relative shrink-0 bg-transparent pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]"

/** Desktop/web composer. */
const chatDesktopComposerBodyClass = `isolate grid grid-cols-[auto_1fr_auto] overflow-hidden rounded-3xl px-1.5 pb-1.5 pt-0.5 text-foreground transition-[box-shadow,background-color] duration-300 ease-out [grid-template-areas:'primary_primary_primary'_'leading_._trailing'] ${chatMobileComposerGlassClass} ${chatDesktopComposerGlassBorderClass} ${chatMobileComposerGlassFocusClass}`

/** Desktop textarea — grows with content up to ~12rem, then scrolls. */
const chatDesktopComposerTextareaClass =
  "field-sizing-content max-h-48 min-h-6 min-w-32 flex-1 resize-none overflow-y-auto rounded-none border-0 bg-transparent p-0 chat-bidi text-start text-[16px] font-normal leading-[1.4] tracking-normal shadow-none placeholder:text-muted-foreground/35 focus-visible:border-transparent focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-100 sm:text-[15px] sm:leading-[1.4] sm:tracking-[-0.01em] dark:bg-transparent dark:placeholder:text-muted-foreground/30 dark:disabled:bg-transparent"

/** Nested control chips — liquid glass above the composer shell. */
const chatDesktopComposerControlClass = `border-0 text-foreground transition-[transform,background-color,box-shadow,color] active:scale-[0.98] ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass}`

const chatDesktopComposerIconButtonClass = `${chatDesktopComposerControlClass} size-11 rounded-full text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-[22px] [&_svg]:stroke-[1.75]`

const chatDesktopComposerEffortButtonClass = `${chatDesktopComposerControlClass} h-11 gap-1 rounded-full px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground [&_svg]:opacity-70`

/**
 * Composer send — iOS 26 `.glassProminent` + `.circle` (Messages pattern).
 * Nested inside glass field → opaque tinted, NOT second translucent glass.
 * 44×44 · arrow.up · press scale · idle = tertiary fill.
 */
const chatMobileComposerSendClass =
  "size-11 shrink-0 overflow-hidden rounded-full border-0 bg-[#2563EB] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(29,78,216,0.22),0_1px_2px_rgba(37,99,235,0.18)] transition-[transform,background-color,box-shadow,color] duration-150 ease-out hover:bg-[#1D4ED8] hover:text-white hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_4px_rgba(37,99,235,0.22)] active:scale-[0.92] disabled:opacity-100 [&_svg:not([class*='size-'])]:size-[18px] [&_svg]:stroke-[2.25]"

/** Idle send — tertiary system fill (Messages empty state). */
const chatMobileComposerSendIdleClass =
  "size-11 shrink-0 overflow-hidden rounded-full border-0 bg-[rgba(118,118,128,0.12)] text-muted-foreground shadow-none transition-[transform,background-color] duration-150 ease-out hover:bg-[rgba(118,118,128,0.16)] active:scale-[0.92] disabled:pointer-events-none disabled:opacity-100 dark:bg-[rgba(118,118,128,0.24)] dark:hover:bg-[rgba(118,118,128,0.28)] [&_svg:not([class*='size-'])]:size-[18px] [&_svg]:stroke-[2.25]"

/** Desktop send — same glassProminent circle as mobile. */
const chatDesktopComposerSendClass = chatMobileComposerSendClass

const chatDesktopComposerSendDisabledClass = chatMobileComposerSendIdleClass

/** Empty-state / follow-up prompt cards. */
const chatSamplePromptButtonClass =
  "relative flex h-full w-full min-w-0 items-start justify-start rounded-3xl border-0 bg-[rgba(118,118,128,0.06)] px-4.5 py-4 text-start shadow-none transition-[background-color,transform] duration-150 ease-out hover:bg-[rgba(118,118,128,0.10)] active:scale-[0.985] active:bg-[rgba(116,116,128,0.12)] sm:px-5 sm:py-4.5 dark:bg-white/[0.12] dark:shadow-none dark:hover:bg-white/[0.16] dark:active:bg-white/[0.18]"

/** Nested icon well. */
const chatSamplePromptIconClass =
  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-2xl bg-white/50 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_82%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_4%,transparent)] backdrop-blur-md backdrop-saturate-150 text-muted-foreground dark:bg-white/[0.1] sm:size-9"

const chatSamplePromptTextClass =
  "flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start lg:gap-0.5"

const chatSamplePromptTitleClass =
  "w-full text-base font-medium leading-5.25 tracking-[-0.02em] text-foreground sm:text-base lg:text-[15px] lg:leading-5"

const chatSamplePromptDescriptionClass =
  "w-full line-clamp-2 text-pretty text-[13px] font-light leading-4.5 tracking-[-0.006em] break-words text-muted-foreground sm:text-[13px] sm:leading-4.5 lg:text-[13px] lg:leading-4.5"

const chatEmptyHeroPromptsClass =
  "chat-empty-hero-prompts mt-1 flex w-full min-w-0 self-stretch flex-col items-center gap-2"

const chatSamplePromptCarouselClass =
  "w-full min-w-0 touch-pan-y lg:hidden [&_[data-slot=carousel-content]]:overflow-x-clip [&_[data-slot=carousel-content]]:px-1.5 [&_[data-slot=carousel-content]]:py-2.5 [&_[data-slot=carousel-content]]:[mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)] [&_[data-slot=carousel-content]]:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)] rtl:[&_[data-slot=carousel-content]]:[mask-image:linear-gradient(to_left,transparent_0%,black_10%,black_90%,transparent_100%)] rtl:[&_[data-slot=carousel-content]]:[-webkit-mask-image:linear-gradient(to_left,transparent_0%,black_10%,black_90%,transparent_100%)]"

const chatSamplePromptCarouselContentClass = "-ms-5 w-full items-stretch"

const chatSamplePromptCarouselItemClass =
  "flex min-w-0 basis-[88%] shrink-0 grow-0 self-stretch ps-5 sm:basis-[86%]"

const chatSamplePromptCarouselDotsClass =
  "mt-2.5 [&_button]:bg-white/45 hover:[&_button]:bg-white/65 [&_button[aria-current=true]]:bg-white dark:[&_button]:bg-white/35 dark:hover:[&_button]:bg-white/55 dark:[&_button[aria-current=true]]:bg-white"

const chatSamplePromptStaticListClass =
  "mx-auto hidden w-full max-w-md grid-cols-1 gap-2 lg:grid"

/** Plain icon controls — 44pt hit target (HIG minimum). */
const chatMobileComposerIconButtonClass =
  `size-11 shrink-0 rounded-full text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out ${chatHoverFillClass} ${chatPressFillClass} hover:text-foreground active:scale-[0.96] [&_svg:not([class*='size-'])]:size-[22px] [&_svg]:stroke-[1.75]`

const chatMobileComposerIconButtonCompactClass =
  `size-11 shrink-0 rounded-full text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out ${chatHoverFillClass} ${chatPressFillClass} hover:text-foreground active:scale-[0.96] [&_svg:not([class*='size-'])]:size-[22px] [&_svg]:stroke-[1.75]`

/**
 * Active tool chip — selected chip (Apple): System Blue @ ~12–15% fill + blue label.
 * Capsule nested in glass composer; Footnote 13.
 */
const chatComposerToolChipClass =
  "shrink-0 border-0 bg-[#2563EB]/12 font-medium text-[#1D4ED8] shadow-none dark:bg-[#2563EB]/22 dark:text-[#93C5FD]"

const chatComposerToolChipCloseClass =
  "flex shrink-0 items-center justify-center rounded-full text-[#1D4ED8]/55 transition-[color,background-color,transform] duration-150 hover:bg-[#2563EB]/12 hover:text-[#1D4ED8] active:scale-95 dark:text-[#93C5FD]/70 dark:hover:bg-[#2563EB]/28 dark:hover:text-[#93C5FD]"

const chatMobileComposerToolChipClass = `${chatComposerToolChipClass} h-7 gap-1.5 rounded-full px-2.5 py-0 text-[13px] leading-4.5 tracking-[-0.006em]`

const chatDesktopComposerToolChipClass = `${chatComposerToolChipClass} mt-0.5 h-7 gap-1.5 rounded-full px-2.5 py-0 text-[13px] leading-4.5 tracking-[-0.006em]`

const chatMobileComposerToolChipCloseClass = `${chatComposerToolChipCloseClass} size-4`

const chatDesktopComposerToolChipCloseClass = `${chatComposerToolChipCloseClass} size-3.5`

const chatMobileScrollDownClass =
  `absolute bottom-[calc(4.875rem+env(safe-area-inset-bottom,0px))] left-1/2 z-10 size-9 -translate-x-1/2 rounded-full border border-white/35 bg-white/[0.18] text-foreground backdrop-blur-[22px] backdrop-saturate-[190%] supports-[backdrop-filter]:bg-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.72),0_2px_10px_-3px_rgba(0,0,0,0.06),0_8px_24px_-10px_rgba(0,0,0,0.1)] transition-[transform,background-color,box-shadow,border-color] duration-150 ease-out hover:border-white/55 hover:bg-white/[0.32] active:scale-[0.96] dark:border-white/16 dark:bg-white/[0.10] dark:supports-[backdrop-filter]:bg-white/[0.07] dark:hover:border-white/28 dark:hover:bg-white/[0.18]`

const chatMobileDrawerSurfaceClass = "bg-background text-foreground"

/** History rail / drawer — tertiary hover, systemFill selected (Apple list). */
const chatHistoryRailGlassItemHoverClass = `${chatHoverFillClass} ${chatPressFillClass}`

const chatHistoryRailGlassItemClass = `border-0 bg-transparent text-foreground shadow-none transition-[transform,background-color] duration-150 ease-out active:scale-[0.985] ${chatHistoryRailGlassItemHoverClass}`

const chatHistoryRailGlassItemActiveClass = chatActiveFillClass

const chatHistoryRailNavItemClass = `h-9 w-full justify-start gap-2.5 rounded-2xl px-3 text-sm font-normal shadow-none ${chatHistoryRailGlassItemClass}`

const chatHistoryRailSectionLabelClass =
  "px-3 pb-1.5 text-[11px] font-light tracking-normal text-muted-foreground/75 lowercase"

const chatHistoryRailChatItemClass = `group/item relative flex min-w-0 items-center gap-1 rounded-2xl ${chatHistoryRailGlassItemClass}`

const chatHistoryRailChatItemPadClass = "ps-1 pe-2 py-0.5"

const chatMobileDrawerNavItemClass = `h-11 w-full justify-start gap-3 rounded-2xl px-3 text-[15px] font-normal shadow-none ${chatHistoryRailGlassItemClass}`

const chatMobileDrawerSectionLabelClass =
  "px-3 pb-1.5 text-xs font-light tracking-normal text-muted-foreground/80 lowercase"

const chatMobileDrawerUpgradeClass = `h-11 shrink-0 rounded-full px-5 text-[15px] font-medium ${chatLandingAccentFillClass}`

/** Compact upgrade pill — history rail, chat header, thread toolbar. */
const chatUpgradePillClass = `h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium ${chatLandingAccentFillClass}`

const chatHistoryRailUpgradeClass = chatUpgradePillClass

/** Chat chrome upgrade — desktop header / thread toolbar. */
const chatThreadUpgradeClass = `hidden gap-1.5 sm:inline-flex ${chatUpgradePillClass}`

/**
 * Thread “Continue with Google” after guest trial exhaustion.
 * Landing primary blue — never shadcn `bg-primary` (near-black).
 */
const chatThreadConnectButtonClass = `h-11 gap-2 rounded-full px-5 text-[15px] font-semibold ${chatLandingAccentFillClass}`

const chatMobileDrawerFooterWrapClass = "relative z-10 shrink-0"

const chatMobileDrawerFooterBarClass = "relative bg-background"

/** Desktop history rail account footer — bg itself softens at the top into the list. */
const chatHistoryRailFooterWrapClass =
  "pointer-events-none relative z-10 -mt-8 shrink-0 pt-8 [background:linear-gradient(to_top,var(--sidebar)_0%,var(--sidebar)_calc(100%-2rem),color-mix(in_oklch,var(--sidebar)_45%,transparent)_calc(100%-0.75rem),transparent_100%)]"

const chatHistoryRailFooterBarClass = "pointer-events-auto relative"

/** Desktop history rail brand header — bg itself softens at the bottom into the list. */
const chatHistoryRailHeaderWrapClass =
  "pointer-events-none relative z-10 -mb-8 shrink-0 pb-8 [background:linear-gradient(to_bottom,var(--sidebar)_0%,var(--sidebar)_calc(100%-2rem),color-mix(in_oklch,var(--sidebar)_45%,transparent)_calc(100%-0.75rem),transparent_100%)]"

const chatHistoryRailHeaderBarClass = "pointer-events-auto relative"

/** Shared mobile bottom sheets — guide, privacy, checkout.
 * Cap height to the visible app viewport so sheets stay above the soft keyboard
 * (SheetContent already offsets with --keyboard-inset-bottom). */
const chatMobileSheetContentClass =
  "max-h-[min(92dvh,720px,calc(var(--app-height,100dvh)-0.5rem))] gap-0 overflow-y-auto rounded-t-[28px] border-0 bg-white/82 pb-0 pt-2 text-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_-16px_48px_-18px_color-mix(in_oklch,var(--foreground)_14%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/68 dark:bg-white/[0.1] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_-16px_48px_-18px_color-mix(in_oklch,black_45%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.07]"

const chatMobileSheetHandleClass =
  "mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-foreground/15 dark:bg-white/20"

const chatMobileSheetHeaderClass = "gap-1.5 space-y-0 px-5 pb-2 pt-0 text-start"

const chatMobileSheetTitleClass =
  "text-[22px] font-normal tracking-tight text-foreground"

const chatMobileSheetDescriptionClass =
  "text-pretty text-[15px] leading-relaxed text-muted-foreground"

const chatMobileSheetBodyClass = "space-y-4 px-5 pb-2"

const chatMobileSheetSectionLabelClass =
  "text-[13px] font-normal tracking-wide text-muted-foreground uppercase"

/** Sheet inner cards — concentric ≈ 34 − 14 padding → 20pt. */
const chatMobileSheetCardClass = `rounded-3xl border-0 px-3.5 py-3 ${chatMobileGlassSurfaceClass}`

const chatMobileSheetFooterClass = "mt-auto gap-0 border-0 !p-0"

/** When the keyboard is open, subtract its inset so we don't double-pad above it. */
const chatMobileSheetFooterBarClass =
  "w-full border-0 bg-transparent px-5 pt-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)-var(--keyboard-inset-bottom,0px)))]"

/** Sheet CTAs — tinted glass primary; secondary soft tint (not opaque marketing fill). */
const chatMobileSheetPrimaryButtonClass = `h-12! min-h-12 w-full rounded-full text-[15px] font-semibold ${chatLandingAccentFillClass}`

const chatMobileSheetSecondaryButtonClass = `h-12! min-h-12 w-full rounded-full text-[15px] font-semibold ${chatAccentSecondaryFillClass}`

const chatMobileSheetGhostButtonClass =
  `h-11 w-full rounded-full text-[15px] font-medium text-foreground transition-colors duration-150 ${chatHoverFillClass}`

const chatMobileSheetConsentCheckedClass = `border-0 ${chatMobileGlassSurfaceClass}`

const chatMobileSheetConsentUncheckedClass = `border-0 bg-white/45 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_70%,transparent)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/32 hover:bg-white/55 dark:bg-white/[0.06] dark:supports-[backdrop-filter]:bg-white/[0.05] dark:hover:bg-white/[0.09]`

/** Desktop centered dialogs — card-tier 28pt continuous. */
const chatLoginConsentDialogClass =
  "gap-0 overflow-hidden rounded-3xl border-0 bg-white/78 p-0 text-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_24px_64px_-24px_color-mix(in_oklch,var(--foreground)_22%,transparent)] ring-0 backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/62 sm:max-w-[24rem] dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_24px_64px_-24px_color-mix(in_oklch,black_50%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.06]"

const chatDesktopDialogClass = chatLoginConsentDialogClass

/** Wider search / command-style dialog — sheet-tier 34pt. */
const chatDesktopSearchDialogClass =
  "flex max-h-[min(32rem,calc(100dvh-2rem))] min-h-0 w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[28px] border-0 bg-white/78 p-0 text-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_24px_64px_-24px_color-mix(in_oklch,var(--foreground)_22%,transparent)] ring-0 backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/62 sm:max-h-[min(36rem,calc(100dvh-3rem))] sm:max-w-xl dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_24px_64px_-24px_color-mix(in_oklch,black_50%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.06]"

const chatDesktopDialogInputClass = `h-10 w-full rounded-2xl border-0 px-3 text-sm text-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_70%,transparent)] backdrop-blur-xl ${chatMobileGlassSurfaceClass} placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-foreground/15 dark:placeholder:text-muted-foreground/40`

const chatDesktopDialogFooterClass =
  "mx-0 mb-0 gap-2 rounded-none border-0 bg-transparent p-4 pt-2 sm:justify-end"

const chatLoginConsentBrandMarkClass = `flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass}`

/**
 * Tools menu — iOS 26 thin Material popover (same family as context menus).
 * Sheet-tier continuous 34pt; nested rows concentric ≈ 20.
 */
const chatMobileToolsMenuClass = [
  "z-60 w-auto min-w-60 max-w-[min(100vw-1.5rem,20rem)]",
  "overflow-hidden rounded-[28px] border-0 p-2.5",
  "bg-white/55 text-foreground shadow-none ring-0",
  "shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_90%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_7%,transparent),0_18px_52px_-18px_color-mix(in_oklch,var(--foreground)_18%,transparent)]",
  "backdrop-blur-2xl backdrop-saturate-[180%]",
  "supports-backdrop-filter:bg-white/40",
  "dark:bg-[oklch(0.22_0_0_/0.82)]",
  "dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_12%,transparent),inset_0_0_0_1px_color-mix(in_oklch,white_8%,transparent),0_20px_56px_-18px_color-mix(in_oklch,black_50%,transparent)]",
  "dark:supports-backdrop-filter:bg-[oklch(0.2_0_0_/0.62)]",
].join(" ")

/** Section label — Caption 2, sentence case (iOS 26). */
const chatMobileToolsMenuLabelClass =
  "px-3 pb-1 pt-1.5 text-[11px] font-medium leading-3.25 tracking-[0.006em] text-muted-foreground"

/** Nested menu row — concentric ≈ 34 − 10 padding → 20–22pt continuous. */
const chatMobileToolsMenuItemClass =
  "flex w-full flex-col items-start gap-0.5 rounded-2xl px-3 py-2.5 text-start transition-colors duration-150 hover:bg-[rgba(118,118,128,0.12)] data-highlighted:bg-[rgba(118,118,128,0.12)] data-[selected=true]:bg-[rgba(120,120,128,0.16)] dark:hover:bg-[rgba(118,118,128,0.24)] dark:data-highlighted:bg-[rgba(118,118,128,0.24)] dark:data-[selected=true]:bg-[rgba(120,120,128,0.32)]"

const chatMobileToolsMenuItemTitleClass =
  "text-[15px] font-medium leading-5 tracking-[-0.016em] text-foreground"

const chatMobileToolsMenuItemDescClass =
  "text-[13px] font-normal leading-4.5 tracking-[-0.006em] text-muted-foreground"

/**
 * Trade signal card — frosted plate, soft ~36pt round (matches message bubbles).
 */
const chatSignalCardClass =
  "relative isolate overflow-hidden rounded-3xl border-0 bg-white/82 text-foreground shadow-none backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/68 dark:bg-[oklch(0.26_0_0_/0.88)] dark:shadow-none dark:backdrop-blur-2xl dark:supports-[backdrop-filter]:bg-[oklch(0.26_0_0_/0.72)]"

/** Corner bloom + top sheen — applied per side on the card shell. */
const chatSignalCardLongWashClass =
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(16,185,129,0.16),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.1),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.55)_0%,transparent_42%)] before:content-[''] dark:before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(52,211,153,0.18),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(96,165,250,0.12),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]"

const chatSignalCardShortWashClass =
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(244,63,94,0.16),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(37,99,235,0.08),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.55)_0%,transparent_42%)] before:content-[''] dark:before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(251,113,133,0.18),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(96,165,250,0.1),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]"

const chatSignalCardInsetClass =
  "rounded-2xl border-0 bg-black/[0.02] p-2 shadow-[inset_0_2px_10px_-6px_color-mix(in_oklch,var(--foreground)_5%,transparent),0_1px_0_0_color-mix(in_oklch,white_45%,transparent)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-black/[0.015] dark:bg-white/[0.03] dark:shadow-[inset_0_2px_12px_-6px_color-mix(in_oklch,black_28%,transparent),0_1px_0_0_color-mix(in_oklch,white_4%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.025]"

const chatSignalCardChipClass =
  "inline-flex items-center gap-1 rounded-full border-0 bg-white/70 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-muted-foreground shadow-[0_1px_3px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_4px_12px_-6px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md supports-[backdrop-filter]:bg-white/55 dark:bg-white/[0.12] dark:shadow-[0_1px_3px_color-mix(in_oklch,black_30%,transparent),0_4px_14px_-6px_color-mix(in_oklch,black_35%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.1]"

const chatSignalCardChipLongClass =
  "inline-flex items-center gap-1 rounded-full border-0 bg-emerald-500/16 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-emerald-700 shadow-[0_1px_3px_rgba(5,150,105,0.12),0_4px_12px_-5px_rgba(5,150,105,0.22)] backdrop-blur-md dark:bg-emerald-400/18 dark:text-emerald-300 dark:shadow-[0_1px_3px_rgba(52,211,153,0.14),0_4px_14px_-5px_rgba(52,211,153,0.24)]"

const chatSignalCardChipShortClass =
  "inline-flex items-center gap-1 rounded-full border-0 bg-rose-500/16 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-rose-700 shadow-[0_1px_3px_rgba(225,29,72,0.12),0_4px_12px_-5px_rgba(225,29,72,0.22)] backdrop-blur-md dark:bg-rose-400/18 dark:text-rose-300 dark:shadow-[0_1px_3px_rgba(251,113,133,0.14),0_4px_14px_-5px_rgba(251,113,133,0.24)]"

const chatSignalCardIconShellClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full border-0 bg-white/65 shadow-[0_1px_3px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_3px_10px_-4px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/48 dark:bg-white/[0.12] dark:shadow-[0_1px_3px_color-mix(in_oklch,black_28%,transparent),0_3px_12px_-4px_color-mix(in_oklch,black_32%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.09]"

const chatSignalCardEntryShellClass =
  "rounded-lg border-0 bg-white/88 shadow-none backdrop-blur-md supports-[backdrop-filter]:bg-white/72 dark:bg-white/[0.14] dark:shadow-none dark:supports-[backdrop-filter]:bg-white/[0.11]"

const chatSignalCardMetricTileClass =
  "rounded-lg border-0 bg-foreground/[0.035] shadow-none backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-foreground/[0.028] dark:bg-white/[0.06] dark:shadow-none dark:supports-[backdrop-filter]:bg-white/[0.045]"

/** Desktop news panel — distinct sidebar surface; glass stays on cards/controls. */
const chatNewsPanelShellClass =
  "border-0 bg-sidebar text-sidebar-foreground rounded-l-xl"

/** Mobile news sheet — same solid fill as the main app / history drawer. */
const chatNewsPanelShellMobileClass = `border-0 ${chatMobileDrawerSurfaceClass}`

const chatNewsPanelHeaderClass =
  "app-mobile-safe-header relative z-1 flex items-center justify-between gap-2 bg-transparent px-4 pb-2"

/** Desktop news rail header — in-flow with roomy top pad. */
const chatNewsPanelHeaderDesktopClass =
  "pointer-events-auto relative flex items-center justify-between gap-2 px-4 pt-3.5 pb-2.5"

/**
 * Desktop news header fade — short soft dissolve (keep tight under the bar).
 */
const chatNewsPanelHeaderDesktopWrapClass =
  "pointer-events-none relative z-10 -mb-2 shrink-0 pb-2"

const chatNewsPanelHeaderDesktopScrimClass =
  "pointer-events-none absolute inset-x-0 top-0 bottom-0 z-0 bg-gradient-to-b from-sidebar from-0% via-sidebar/40 via-70% to-transparent to-100% backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,black_0%,black_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_60%,transparent_100%)] supports-[backdrop-filter]:from-sidebar/80 supports-[backdrop-filter]:via-sidebar/15 supports-[backdrop-filter]:to-transparent dark:from-sidebar dark:via-sidebar/45 dark:supports-[backdrop-filter]:from-sidebar/88 dark:supports-[backdrop-filter]:via-sidebar/20"

/** Liquid-glass age chip — same 44 pt height as nav glass controls. */
const chatNewsFreshnessBadgeClass = `inline-flex h-11 shrink-0 items-center justify-center self-center rounded-full px-4 font-mono text-[11px] font-normal leading-none tracking-tight text-muted-foreground ${chatMobileGlassSurfaceClass}`

/** Desktop news age chip — matches history-rail icon height (36 pt). */
const chatNewsFreshnessBadgeDesktopClass = `inline-flex h-9 shrink-0 items-center justify-center self-center rounded-full px-3 font-mono text-[11px] font-normal leading-none tracking-tight text-muted-foreground ${chatMobileGlassSurfaceClass}`

const chatNewsReadAllButtonClass = chatMobileHeaderModelClass

/** News cards / brief — same frosted plate language as signal cards. */
const chatNewsGlassCardClass =
  "relative isolate overflow-hidden rounded-3xl border-0 bg-[oklch(0.97_0_0_/0.72)] text-foreground shadow-none backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-[oklch(0.97_0_0_/0.55)] dark:bg-[oklch(0.26_0_0_/0.72)] dark:shadow-none dark:backdrop-blur-2xl dark:supports-[backdrop-filter]:bg-[oklch(0.26_0_0_/0.55)]"
const chatNewsGlassInsetClass = chatSignalCardInsetClass
/** Tape metric tiles — nested concentric wells. */
const chatNewsGlassTileClass =
  "rounded-2xl border-0 bg-foreground/[0.035] shadow-none backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-foreground/[0.028] dark:bg-white/[0.06] dark:shadow-none dark:supports-[backdrop-filter]:bg-white/[0.045]"
const chatNewsGlassChipClass =
  "inline-flex items-center gap-1 rounded-full border-0 bg-white/70 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-muted-foreground shadow-none backdrop-blur-md supports-[backdrop-filter]:bg-white/55 dark:bg-white/[0.12] dark:shadow-none dark:supports-[backdrop-filter]:bg-white/[0.1]"

export {
  chatMobileAssistantClass,
  chatMobileComposerIconButtonClass,
  chatMobileComposerIconButtonCompactClass,
  chatMobileComposerPillClass,
  chatMobileComposerPillCompactClass,
  chatMobileComposerPillExpandedClass,
  chatMobileComposerLeadingClass,
  chatMobileComposerTrailingClass,
  chatMobileComposerTextareaClass,
  chatMobileComposerTextareaCompactClass,
  chatMobileComposerTextareaExpandedClass,
  chatMobileComposerSendClass,
  chatMobileComposerSendIdleClass,
  chatDesktopCanvasClass,
  chatDesktopComposerBodyClass,
  chatDesktopComposerTextareaClass,
  chatDesktopComposerEffortButtonClass,
  chatDesktopComposerIconButtonClass,
  chatDesktopComposerSendClass,
  chatDesktopComposerSendDisabledClass,
  chatDesktopComposerShellClass,
  chatDesktopComposerToolChipClass,
  chatDesktopComposerToolChipCloseClass,
  chatMobileComposerToolChipClass,
  chatMobileComposerToolChipCloseClass,
  chatMobileComposerShellClass,
  chatMobileEmptyHeroContentClass,
  chatMobileEmptyHeroMarkClass,
  chatMobileEmptyHeroTitleClass,
  chatMobileEmptyHeroWrapClass,
  chatHistoryRailChatItemClass,
  chatHistoryRailChatItemPadClass,
  chatHistoryRailFooterBarClass,
  chatHistoryRailFooterWrapClass,
  chatHistoryRailHeaderBarClass,
  chatHistoryRailHeaderWrapClass,
  chatHistoryRailGlassItemActiveClass,
  chatHistoryRailGlassItemClass,
  chatHistoryRailNavItemClass,
  chatHistoryRailSectionLabelClass,
  chatMobileDrawerFooterBarClass,
  chatMobileDrawerFooterWrapClass,
  chatMobileDrawerNavItemClass,
  chatMobileDrawerSectionLabelClass,
  chatMobileDrawerSurfaceClass,
  chatMobileDrawerUpgradeClass,
  chatHistoryRailUpgradeClass,
  chatThreadConnectButtonClass,
  chatThreadUpgradeClass,
  chatUpgradePillClass,
  chatDesktopSidebarIconButtonClass,
  chatMobileHeaderButtonClass,
  chatMobileHeaderShellClass,
  chatMobileHeaderScrimClass,
  chatMobileComposerDockClass,
  chatMobileHeaderModelClass,
  chatMobileHeaderNewChatClass,
  chatMobileHeaderAvatarButtonClass,
  chatMobileHeaderAvatarClass,
  chatMobileHeaderPlanBadgeClass,
  chatMobileHeaderModelPrimaryClass,
  chatMobileHeaderModelSecondaryClass,
  chatMobilePrimaryButtonClass,
  chatNewsFreshnessBadgeClass,
  chatNewsFreshnessBadgeDesktopClass,
  chatNewsGlassCardClass,
  chatNewsGlassChipClass,
  chatNewsGlassInsetClass,
  chatNewsGlassTileClass,
  chatNewsPanelHeaderClass,
  chatNewsPanelHeaderDesktopClass,
  chatNewsPanelHeaderDesktopScrimClass,
  chatNewsPanelHeaderDesktopWrapClass,
  chatNewsPanelShellClass,
  chatNewsPanelShellMobileClass,
  chatNewsReadAllButtonClass,
  chatSignalCardChipClass,
  chatSignalCardChipLongClass,
  chatSignalCardChipShortClass,
  chatSignalCardClass,
  chatSignalCardLongWashClass,
  chatSignalCardShortWashClass,
  chatSignalCardEntryShellClass,
  chatSignalCardIconShellClass,
  chatSignalCardInsetClass,
  chatSignalCardMetricTileClass,
  chatMobileScrollDownClass,
  chatEmptyHeroPromptsClass,
  chatSamplePromptButtonClass,
  chatSamplePromptCarouselClass,
  chatSamplePromptCarouselContentClass,
  chatSamplePromptCarouselDotsClass,
  chatSamplePromptCarouselItemClass,
  chatSamplePromptStaticListClass,
  chatSamplePromptDescriptionClass,
  chatSamplePromptIconClass,
  chatSamplePromptTextClass,
  chatSamplePromptTitleClass,
  chatMobileGlassSurfaceClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
  chatMobileSheetConsentCheckedClass,
  chatMobileSheetConsentUncheckedClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetGhostButtonClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetSectionLabelClass,
  chatMobileSheetTitleClass,
  chatLoginConsentBrandMarkClass,
  chatLoginConsentDialogClass,
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatDesktopDialogInputClass,
  chatDesktopSearchDialogClass,
  chatMobileThreadClass,
  chatMobileThreadFirstTurnClass,
  chatMobileThreadTopSpacerClass,
  chatMobileThreadBottomSpacerClass,
  chatMobileThreadBottomFadeClass,
  chatMobileThreadScrollMaskClass,
  chatMobileToolsMenuClass,
  chatMobileToolsMenuItemClass,
  chatMobileToolsMenuItemDescClass,
  chatMobileToolsMenuItemTitleClass,
  chatMobileToolsMenuLabelClass,
  chatMobileUserBubbleClass,
  chatMobileUserBubbleInteractiveClass,
}
