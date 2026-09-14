import Image from "next/image"

import { cn } from "@/lib/utils"

export const IRIS_LAB_LOGO_LIGHT_SRC = "/iris-lab-logo-light.svg"
export const IRIS_LAB_LOGO_DARK_SRC = "/iris-lab-logo-dark.svg"

type IrisLabLogoProps = {
  className?: string
  imageClassName?: string
  /** Intrinsic pixel size for next/image (layout scales via className). */
  size?: number
  priority?: boolean
  alt?: string
  /** Hide from assistive tech when parent link/button already names the brand. */
  decorative?: boolean
}

function IrisLabLogo({
  className,
  imageClassName,
  size = 32,
  priority,
  alt = "Exur",
  decorative = false,
}: IrisLabLogoProps) {
  const label = decorative ? undefined : alt
  const shared = cn("h-auto w-full max-w-full object-contain", imageClassName)

  return (
    <span
      className={cn("relative inline-flex aspect-square shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <Image
        src={IRIS_LAB_LOGO_LIGHT_SRC}
        alt=""
        width={size}
        height={size}
        priority={priority}
        sizes={`${size}px`}
        className={cn(shared, "dark:hidden")}
      />
      <Image
        src={IRIS_LAB_LOGO_DARK_SRC}
        alt=""
        width={size}
        height={size}
        priority={priority}
        sizes={`${size}px`}
        className={cn(shared, "absolute inset-0 hidden dark:block")}
      />
    </span>
  )
}

export { IrisLabLogo }
