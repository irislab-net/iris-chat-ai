import { cn } from "@/lib/utils"

/** Resolve `/public` assets for chrome-extension:// pages. */
function extensionAsset(path: string) {
  const relative = path.startsWith("/") ? path.slice(1) : path
  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(relative)
    }
  } catch {
    /* ignore */
  }
  return path.startsWith("/") ? path : `/${path}`
}

export const EXUR_LOGO_LIGHT_SRC = extensionAsset("/exur-logo-light.svg")
export const EXUR_LOGO_DARK_SRC = extensionAsset("/exur-logo-dark.svg")
export const EXUR_LOGO_BRAND_SRC = extensionAsset("/exur-logo-brand.svg")
export const EXUR_LOGO_MARK_WHITE_SRC = extensionAsset(
  "/exur-logo-mark-white.svg"
)
export const EXUR_LOGO_GRADIENT_SRC = extensionAsset("/exur-logo-gradient.svg")

type ExurLogoProps = {
  className?: string
  imageClassName?: string
  /** Intrinsic pixel size (layout scales via className). */
  size?: number
  priority?: boolean
  alt?: string
  /** Hide from assistive tech when parent link/button already names the brand. */
  decorative?: boolean
  /** `on-hero` = white mark on transparent; `on-light` = black mark; `brand` = blue mark; `gradient` = white shell + black gradient mark. */
  variant?: "auto" | "on-hero" | "on-light" | "on-dark" | "brand" | "gradient"
}

function LogoPicture({
  src,
  size,
  className,
  priority,
}: {
  src: string
  size: number
  className?: string
  priority?: boolean
}) {
  return (
    <picture>
      <source srcSet={src} type="image/svg+xml" />
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={className}
      />
    </picture>
  )
}

function ExurLogo({
  className,
  imageClassName,
  size = 32,
  priority,
  alt = "Exur",
  decorative = false,
  variant = "auto",
}: ExurLogoProps) {
  const label = decorative ? undefined : alt
  const shared = cn("size-full object-contain", imageClassName)
  const showThemePair = variant === "auto"

  return (
    <span
      className={cn("relative inline-flex aspect-square shrink-0", className)}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
    >
      {(variant === "auto" || variant === "on-dark") && (
        <LogoPicture
          src={EXUR_LOGO_LIGHT_SRC}
          size={size}
          priority={priority}
          className={cn(
            shared,
            showThemePair ? "absolute inset-0 hidden dark:block" : undefined
          )}
        />
      )}
      {variant === "on-hero" && (
        <LogoPicture
          src={EXUR_LOGO_MARK_WHITE_SRC}
          size={size}
          priority={priority}
          className={shared}
        />
      )}
      {variant === "brand" && (
        <LogoPicture
          src={EXUR_LOGO_BRAND_SRC}
          size={size}
          priority={priority}
          className={shared}
        />
      )}
      {variant === "gradient" && (
        <LogoPicture
          src={EXUR_LOGO_GRADIENT_SRC}
          size={size}
          priority={priority}
          className={shared}
        />
      )}
      {(variant === "auto" || variant === "on-light") && (
        <LogoPicture
          src={EXUR_LOGO_DARK_SRC}
          size={size}
          priority={priority}
          className={cn(shared, showThemePair && "dark:hidden")}
        />
      )}
    </span>
  )
}

export { ExurLogo }
