import Card from "@/components/common/card"
import LandingSection from "@/components/common/landingSection"
import SectionHeader from "@/components/common/sectionHeader"
import { AnimatedActivity } from "@/components/icons/animated/animatedActivity"
import { AnimatedBlend } from "@/components/icons/animated/animatedBlend"
import { AnimatedLayers } from "@/components/icons/animated/animatedLayers"
import { AnimatedList } from "@/components/icons/animated/animatedList"
import { AnimatedLock } from "@/components/icons/animated/animatedLock"
import { AnimatedWallet } from "@/components/icons/animated/animatedWallet"
import {
  STAKING_CHAIN_ID,
  STAKING_VAULT_ADDRESS,
} from "@/constants/stakingVaultConfig"
import { stakingAddressExplorerUrlForChain } from "@/lib/stakingExplorer"
import type { AnimatedIcon } from "@/types/icon"

type UtilityBlock = {
  title: string
  lines: string[]
  contractLink?: boolean
  animatedIcon: AnimatedIcon
}

const utilities: UtilityBlock[] = [
  {
    title: "Real-time balance and rewards",
    animatedIcon: AnimatedActivity,
    lines: [
      "Your balance matches your on-chain position.",
      "Rewards and timing follow live protocol data.",
      "What you see reflects how the protocol is running at that moment.",
    ],
  },
  {
    title: "Operational yield model",
    animatedIcon: AnimatedBlend,
    lines: [
      "Matrix uses USDM across cross-venue arbitrage and liquidity operations.",
      "That keeps the yield model tied to execution activity instead of a single source.",
      "See the current split in the chart above.",
    ],
  },
  {
    title: "Deposit and withdraw from your wallet",
    animatedIcon: AnimatedWallet,
    lines: [
      "Withdraw when you choose; each move is signed in your wallet.",
      "Nothing moves without your approval.",
      "Timing depends on network activity and how the contract processes the transaction.",
    ],
  },
  {
    title: "Reserve layer",
    animatedIcon: AnimatedLayers,
    lines: [
      "An operational reserve supports stability and day-to-day liquidity needs inside the system.",
      "Your assets move only after you sign a transaction in your wallet.",
    ],
  },
  {
    title: "On-chain transparency",
    animatedIcon: AnimatedLock,
    lines: [
      "Every stake and unstake is written to the chain.",
      "You can verify activity on a public block explorer at any time.",
    ],
    contractLink: true,
  },
  {
    title: "Clear layout",
    animatedIcon: AnimatedList,
    lines: [
      "The app surfaces allocation, balances, and reward estimates in one place.",
      "Results still follow real network and market conditions.",
    ],
  },
]

function StakingUtilities() {
  const vaultExplorerUrl = stakingAddressExplorerUrlForChain(
    STAKING_CHAIN_ID,
    STAKING_VAULT_ADDRESS
  )

  return (
    <LandingSection className='space-y-16'>
      <SectionHeader
        header='What you actually get'
        description='You stake from your wallet and stay in control. Each action is signed by you and settled on-chain. Nothing moves without your approval.'
        descriptionClassName='max-w-2xl pe-6'
      />

      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {utilities.map((block, index) => (
          <Card
            key={index}
            playAnimatedIconOnView
            card={{ title: block.title, animatedIcon: block.animatedIcon }}
            className='gap-1 py-12'
            titleClassName='text-base'
            contentClassName='space-y-3 text-sm text-neutral-600 leading-relaxed'
          >
            {block.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {block.contractLink && vaultExplorerUrl ? (
              <p className='pt-1'>
                <a
                  href={vaultExplorerUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-medium text-neutral-800 underline underline-offset-2 hover:text-neutral-950'
                >
                  View smart contract
                </a>
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </LandingSection>
  )
}

export default StakingUtilities
