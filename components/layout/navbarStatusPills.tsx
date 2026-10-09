import { cn } from "@/lib/utils"
import GlowingButton from "../common/glowingButton"

const APY_STATUS_LABEL = "Up to 48% APY"

function NavbarStatusPill({ loopGlow = false }: { loopGlow?: boolean }) {
  return (
    <GlowingButton
      variant='outline'
      size='sm'
      buttonClassName='!px-3 sm:w-auto'
      className='w-full sm:w-auto'
      loopGlow={loopGlow}
    >
      <span className='text-xs'>{APY_STATUS_LABEL}</span>
    </GlowingButton>
  )
}

function NavbarStatusPillsList({
  mobileOnly,
  loopGlow = false,
}: {
  mobileOnly: boolean
  loopGlow?: boolean
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center",
        mobileOnly ? "md:hidden" : "hidden md:flex"
      )}
      role='status'
      aria-label='Protocol status'
    >
      <NavbarStatusPill loopGlow={loopGlow} />
    </div>
  )
}

export function NavbarStatusPillsDesktop({ loopGlow = false }: { loopGlow?: boolean }) {
  return <NavbarStatusPillsList mobileOnly={false} loopGlow={loopGlow} />
}

export function NavbarStatusPillsMobile({ loopGlow = false }: { loopGlow?: boolean }) {
  return <NavbarStatusPillsList mobileOnly loopGlow={loopGlow} />
}
