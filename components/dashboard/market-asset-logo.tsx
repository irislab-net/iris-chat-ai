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
  const showImage = Boolean(src && !failed)
  // TradingView marks ship as square plates with inset artwork; scale crops that padding.
  const tradingViewPlate = Boolean(src?.includes("tradingview.com"))

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        !showImage && "bg-background/55 dark:bg-background/35",
        className
      )}
      aria-hidden
    >
      {showImage && src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized={src.includes(".svg") || tradingViewPlate}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className={cn(
            "size-full rounded-full object-cover",
            tradingViewPlate && "scale-[1.42]",
            imageClassName
          )}
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
