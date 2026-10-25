import Image from "next/image"

import { cn } from "@/lib/utils"
import { marketAssetLogoSrc } from "@/lib/market-asset-logo"
import * as React from "react"

function MarketAssetLogo({
  symbol,
  className,
  imageClassName,
  size = 32,
}: {
  symbol: string
  className?: string
  imageClassName?: string
  /** Intrinsic image size for Next/Image (CSS size comes from `className`). */
  size?: number
}) {
  const key = symbol.trim().toUpperCase()
  const src = marketAssetLogoSrc(key)
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const failed = failedSrc === src

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-background/55 dark:bg-background/35",
        className
      )}
      aria-hidden
    >
      {src && !failed ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized={src.includes(".svg") || src.includes("tradingview.com")}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className={cn("size-full rounded-full object-cover", imageClassName)}
        />
      ) : (
        <span className="font-mono text-[9px] font-bold text-muted-foreground">
          {key.slice(0, 2)}
        </span>
      )}
    </span>
  )
}

export { MarketAssetLogo }
