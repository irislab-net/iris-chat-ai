import { publicTokenSymbolLabel } from "@/lib/publicTokenDisplay"
import { resolveStakingChainBadgeUrl } from "@/lib/stakingChainBadgeVisuals"
import { resolveStakingTokenLogoUrl } from "@/lib/stakingTokenVisuals"
import type { ChainFamily } from "@/staking/core/types"
import { cn } from "@/lib/utils"

type StakingTokenIconProps = {
  symbol: string
  className?: string
  /** Tailwind size class, e.g. size-5 — applies to the outer token frame. */
  sizeClassName?: string
  title?: string
  /** Small chain badge (bottom-right) so EVM vs Tron is visible on the avatar. */
  chainFamily?: ChainFamily
}

const CHAIN_BADGE_SHELL =
  "pointer-events-none absolute -bottom-px -end-px flex overflow-hidden rounded-full bg-white shadow-sm ring-2 ring-white"

export function StakingTokenIcon({
  symbol,
  className,
  sizeClassName = "size-5",
  title,
  chainFamily,
}: StakingTokenIconProps) {
  const src = resolveStakingTokenLogoUrl(symbol)
  const label = title ?? publicTokenSymbolLabel(symbol.trim() || "Token")
  const badgeSrc = chainFamily ? resolveStakingChainBadgeUrl(chainFamily) : null

  const main = src ? (
    <img
      src={src}
      alt=""
      aria-hidden
      title={label}
      className='size-full rounded-full object-contain'
    />
  ) : (
    <span
      role='img'
      aria-label={label}
      title={label}
      className='inline-block size-full rounded-full bg-neutral-200 ring-1 ring-neutral-300/80'
    />
  )

  if (!badgeSrc) {
    if (src) {
      return (
        <img
          src={src}
          alt=''
          aria-hidden
          title={label}
          className={cn("shrink-0 rounded-full object-contain", sizeClassName, className)}
        />
      )
    }
    return (
      <span
        role='img'
        aria-label={label}
        title={label}
        className={cn(
          "inline-block shrink-0 rounded-full bg-neutral-200 ring-1 ring-neutral-300/80",
          sizeClassName,
          className
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-visible",
        sizeClassName,
        className
      )}
    >
      {main}
      <span
        className={cn(
          CHAIN_BADGE_SHELL,
          "h-[52%] w-[52%] min-h-2.5 min-w-2.5 max-h-5 max-w-5"
        )}
      >
        <img
          src={badgeSrc}
          alt=''
          aria-hidden
          className='size-full object-cover'
        />
      </span>
    </span>
  )
}
