import usdmHero from "@/assets/png/usdm-hero.png"
import Frame from "@/components/common/frame"
import GlowingButton from "@/components/common/glowingButton"
import Heading from "@/components/common/heading"
import LandingSection from "@/components/common/landingSection"
import { Badge } from "@/components/ui/staking-badge"
import { PreservedLink } from "@/components/common/PreservedLink"
import { usePreservedNavigate } from "@/hooks/usePreservedNavigate"
import {
  USDM_SYNTHETIC_DOLLAR,
  USDM_TOKEN_SYMBOL,
} from "@/lib/publicTokenDisplay"
import { ArrowRight } from "lucide-react"

function StakingHeader() {
  const navigate = usePreservedNavigate()

  return (
    <LandingSection className='flex flex-col-reverse gap-8 pt-[96px] md:gap-12 md:pt-[150px] lg:flex-row lg:items-center lg:gap-16 xl:gap-20'>
      <div className='z-10 flex min-w-0 flex-1 flex-col lg:max-w-2xl'>
        <PreservedLink to="/staking" className="self-start">
          <Badge className='badge flex items-center gap-2 px-3 py-1.5 text-xs font-normal leading-snug text-neutral-500'>
            <span className='font-brand font-medium text-neutral-700'>
              {USDM_TOKEN_SYMBOL}
            </span>
            <span className='text-neutral-300' aria-hidden>
              ·
            </span>
            <span>{USDM_SYNTHETIC_DOLLAR}</span>
            <ArrowRight className='size-3.5 shrink-0 text-neutral-500' />
          </Badge>
        </PreservedLink>

        <Heading
          animate
          level={1}
          className='mt-4 text-2xl leading-[1.12] text-neutral-900 md:mt-5 md:text-4xl md:leading-tight xl:text-5xl'
        >
          {USDM_TOKEN_SYMBOL}
        </Heading>

        <div className='mt-4 max-w-xl space-y-2.5 text-base leading-relaxed text-neutral-600 md:mt-5 md:text-lg'>
          <p>
            {USDM_TOKEN_SYMBOL} a synthetic dollar for protocol rewards.
          </p>
        </div>

        <div className='mt-8 flex w-full flex-row gap-3 sm:mt-9 sm:w-auto  sm:flex-wrap sm:items-center'>
          <GlowingButton
            variant='default'
            size='lg'
            buttonClassName='!px-5 flex-1 relative'
            className='w-full sm:w-auto'
            onClick={() => navigate("/staking")}
          >
            <span className="animate-pulse bg-white rounded-full size-2 absolute top-1/2 -translate-y-1/2 left-3"></span>
            <span className="font-semibold text-[1.1em] pl-0 md:pl-2">
              Launch app
            </span>
          </GlowingButton>
          <GlowingButton
            variant="outline"
            size="lg"
            buttonClassName="!px-5 flex-1 relative"
            className="w-full sm:w-auto"
            onClick={() => navigate("/")}
          >
            <span className="font-semibold text-[1.1em]">Back to chat</span>
          </GlowingButton>
        </div>
      </div>

      <Frame
        className='relative flex min-h-[200px] w-full flex-1 flex-col items-center justify-center rounded-4xl bg-neutral-50 p-6 sm:min-h-[240px] lg:min-h-[280px]'
      >
        <img
          src={typeof usdmHero === "string" ? usdmHero : usdmHero.src}
          alt={USDM_TOKEN_SYMBOL}
          className="h-auto w-2/5 object-contain"
          width={270}
          height={270}
          decoding="async"
          fetchPriority="high"
        />
      </Frame>
    </LandingSection>
  )
}

export default StakingHeader
