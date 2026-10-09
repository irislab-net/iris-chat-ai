import QAList from "@/components/common/qaList"
import StickySection from "@/components/common/stickySection"
import { Button } from "@/components/ui/button"
import type { QA } from "@/types/qa"
import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"

const qas: QA[] = [
  {
    question: "What is USDM Staking?",
    answer:
      "You deposit supported stablecoins (such as USDT) into a vault contract and receive a USDM position. USDM is a synthetic dollar designed to trade near a $1 target. Your balance, estimated rewards, and pool split appear in the interface, and the contracts are public for review.",
  },
  {
    question: "How do I start?",
    answer:
      "Open the app, select the correct network and deposit asset, enter an amount, then approve each step in your wallet. Your position and estimated rewards are shown in USDM. Review fees and any referral field before you sign.",
  },
  {
    question: "What does the three-part split mean?",
    answer:
      "The pool is allocated across cross-venue arbitrage, liquidity operations, and an operational reserve. The chart shows the current operating model, not a promise of a personal return.",
  },
  {
    question: "When can I unstake?",
    answer:
      "You can start an unstake from your wallet whenever you choose. After you submit, settlement follows network and contract rules. Timing varies with gas, blocks, and contract logic.",
  },
  {
    question: "Does Matrix custody my funds?",
    answer:
      "No. Your keys stay with you. If a balance moves, it is because you signed the transaction.",
  },
  {
    question: "How precise is the target APY?",
    answer:
      "Use displayed target APY as an up-to directional signal. It moves with protocol activity, execution conditions, liquidity conditions, and market changes.",
  },
  {
    question: "Why do dashboard numbers change?",
    answer:
      "Rewards, timers, and balances refresh as new blocks arrive and live data updates. Small shifts are normal.",
  },
  {
    question: "What fees apply?",
    answer:
      "You pay network gas. The vault contract may also apply protocol fees or limits. Check both before you confirm.",
  },
]

function StakingFaq() {
  return (
    <StickySection header='Frequently asked questions'>
      <QAList list={qas}>
        <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6'>
          <Link href="/">
            <Button variant="link" size="lg" className="h-auto! px-1! py-2!">
              <span className="font-semibold">Back to app</span>
              <ArrowRight />
            </Button>
          </Link>
        </div>
      </QAList>
    </StickySection>
  )
}

export default StakingFaq
