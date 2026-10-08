import Frame from "@/components/common/frame"
import GlowingButton from "@/components/common/glowingButton"
import LandingSection from "@/components/common/landingSection"
import { PreservedLink } from "@/components/common/PreservedLink"
import {
  STAKING_CHAIN_ID,
  STAKING_EXPLORER_LABEL,
  STAKING_NETWORK_LABEL,
  STAKING_VAULT_ADDRESS,
} from "@/constants/stakingVaultConfig"
import { stakingAddressExplorerUrlForChain } from "@/lib/stakingExplorer"

function StakingOnChainTransparency() {
  const vaultExplorerUrl = stakingAddressExplorerUrlForChain(
    STAKING_CHAIN_ID,
    STAKING_VAULT_ADDRESS
  )

  return (
    <LandingSection>
      <Frame className='flex flex-col items-center justify-center gap-6 py-18 px-8 bg-neutral-50 text-center'>
        <div className='flex max-w-lg flex-col gap-2'>
          <h2 className='text-2xl md:text-4xl font-semibold font-brand text-neutral-900'>
            Verify on-chain
          </h2>
          <p className='text-sm leading-relaxed text-neutral-600'>
            Stakes, unstakes, and balances are recorded on-chain. Cross-check the
            vault on a block explorer or review contract addresses and audits.
          </p>
        </div>

        <GlowingButton
          variant='outline'
          size='lg'
          disabled={!vaultExplorerUrl}
          onClick={() => {
            if (vaultExplorerUrl) {
              window.open(vaultExplorerUrl, "_blank", "noopener,noreferrer")
            }
          }}
        >
          View on {STAKING_EXPLORER_LABEL}
        </GlowingButton>

        <p className='flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-neutral-600'>
          <PreservedLink
            to='/docs/resources/addresses'
            className='font-medium text-neutral-800 underline-offset-2 hover:underline'
          >
            Contract addresses
          </PreservedLink>
          <span className='text-neutral-300' aria-hidden>
            ·
          </span>
          <PreservedLink
            to='/transparency'
            className='font-medium text-neutral-800 underline-offset-2 hover:underline'
          >
            Transparency
          </PreservedLink>
        </p>

        <p className='text-xs text-neutral-500'>
          {STAKING_NETWORK_LABEL}, chain ID {STAKING_CHAIN_ID}
          <span className='sr-only'>
            . Vault address {STAKING_VAULT_ADDRESS}
          </span>
        </p>
      </Frame>
    </LandingSection>
  )
}

export default StakingOnChainTransparency
