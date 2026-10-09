"use client"
import AnimatedLogo from "@/components/common/animatedLogo"
import { cn } from "@/lib/utils"

/** Site logomark with infinity stroke animation (GSAP). Decorative — set aria on parent. */
export function BrandLoadingMark({
  className,
  logoClassName,
}: {
  className?: string
  logoClassName?: string
}) {
  return (
    <div className={cn("text-neutral-900 flex flex-col items-center justify-center", className)} aria-hidden>
      <AnimatedLogo animate='loading' className={cn("size-14", logoClassName)} />
      <p className='text-sm font-semibold text-neutral-500 mt-2'>Simpilycity is our DNA</p>
    </div>
  )
}
