import Image from "next/image"

import { cn } from "@/lib/utils"

export const IRIS_LAB_LOGO_LIGHT_SRC = "/iris-lab-logo-light.svg"
export const IRIS_LAB_LOGO_DARK_SRC = "/iris-lab-logo-dark.svg"
export const IRIS_LAB_LOGO_BRAND_SRC = "/iris-lab-logo-brand.svg"
export const IRIS_LAB_LOGO_MARK_WHITE_SRC = "/iris-lab-logo-mark-white.svg"
export const IRIS_LAB_LOGO_GRADIENT_SRC = "/iris-lab-logo-gradient.svg"

type IrisLabLogoProps = {
  className?: string
  imageClassName?: string
  /** Intrinsic pixel size for next/image (layout scales via className). */
  size?: number
  priority?: boolean
  alt?: string
  /** Hide from assistive tech when parent link/button already names the brand. */
  decorative?: boolean
  /** `on-hero` = white mark on transparent; `on-light` = black mark; `brand` = blue mark; `gradient` = white shell + black gradient mark. */
  variant?: "auto" | "on-hero" | "on-light" | "on-dark" | "brand" | "gradient"
}

function IrisLabLogo({
  className,
  imageClassName,
  size = 32,
  priority,
  alt = "Exur",
  decorative = false,
  variant = "auto",
}: IrisLabLogoProps) {
  const label = decorative ? undefined : alt
  const shared = cn("size-full object-contain", imageClassName)
  const showThemePair = variant === "auto"

  return (
    <span
      className={cn("relative inline-flex aspect-square shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {(variant === "auto" || variant === "on-dark") && (
        <Image
          src={IRIS_LAB_LOGO_LIGHT_SRC}
          alt=""
          width={size}
          height={size}
          priority={priority}
          sizes={`${size}px`}
          className={cn(shared, showThemePair && "dark:hidden")}
        />
      )}
      {variant === "on-hero" && (
        <Image
          src={IRIS_LAB_LOGO_MARK_WHITE_SRC}
          alt=""
          width={size}
          height={size}
          priority={priority}
          sizes={`${size}px`}
          className={shared}
        />
      )}
      {variant === "brand" && (
        <Image
          src={IRIS_LAB_LOGO_BRAND_SRC}
          alt=""
          width={size}
          height={size}
          priority={priority}
          sizes={`${size}px`}
          className={shared}
        />
      )}
      {variant === "gradient" && (
        <Image
          src={IRIS_LAB_LOGO_GRADIENT_SRC}
          alt=""
          width={size}
          height={size}
          priority={priority}
          sizes={`${size}px`}
          className={shared}
        />
      )}
      {(variant === "auto" || variant === "on-light") && (
        <Image
          src={IRIS_LAB_LOGO_DARK_SRC}
          alt=""
          width={size}
          height={size}
          priority={priority}
          sizes={`${size}px`}
          className={cn(
            shared,
            showThemePair ? "absolute inset-0 hidden dark:block" : undefined
          )}
        />
      )}
    </span>
  )
}

export { IrisLabLogo }
