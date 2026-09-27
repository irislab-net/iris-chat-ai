import * as React from "react"

import { cn } from "@/lib/utils"
import { marketAssetLogoSrc } from "@/lib/market-asset-logo"

function MarketAssetLogo({
  symbol,
  className,
  imageClassName,
  size = 32,
}: {
  symbol: string
  className?: string
  imageClassName?: string
  size?: number
}) {
  const key = symbol.trim().toUpperCase()
  const src = marketAssetLogoSrc(key)
  const [failed, setFailed] = React.useState(false)

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-background/55 dark:bg-background/35",
        className
      )}
      aria-hidden
    >
      {src && !failed ? (
        // Extension runtime — remote market logos; next/image is not available here.
        // eslint-disable-next-line @next/next/no-img-element -- intentional plain img
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
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
