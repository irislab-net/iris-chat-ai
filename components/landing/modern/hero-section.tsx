"use client"

import { ArrowRightIcon, ChevronDownIcon } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"

import { MarketNetwork } from "@/components/landing/modern/market-network"
import { Button } from "@/components/ui/button"
import { MARKET_NODES, scrollToSection } from "@/lib/landing-modern-data"
import { LANDING_EASE } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function NodeDetailCard({
  node,
  className,
}: {
  node: (typeof MARKET_NODES)[number]
  className?: string
}) {
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: LANDING_EASE }}
      className={cn(
        "rounded-2xl border border-black/[0.06] bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl",
        className
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="size-1.5 animate-pulse-dot rounded-full bg-[#2563EB]" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
          {node.label}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#0F172A]">
          {node.title}
        </p>
        <span className="rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#7C3AED]">
          {node.delta}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-[#525866]">{node.desc}</p>
    </motion.div>
  )
}

export function HeroSection() {
  const [activeNode, setActiveNode] = useState(MARKET_NODES[0])

  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pb-24 sm:pt-44 lg:pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.09),transparent_60%)]"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 sm:gap-16 sm:px-12 lg:grid-cols-12 lg:gap-8 lg:px-20">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
          className="lg:col-span-6"
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 24 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: LANDING_EASE } },
            }}
            className="mb-8 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2563EB]"
          >
            The intelligence layer between you and the financial world
          </motion.p>

          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.02] tracking-tight text-[#0F172A] sm:text-7xl lg:text-[5.4rem]">
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: LANDING_EASE } },
              }}
              className="block overflow-hidden pb-1"
            >
              Your Financial
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: LANDING_EASE } },
              }}
              className="block overflow-hidden pb-2"
            >
              Brain<span className="text-[#2563EB]">.</span>
            </motion.span>
          </h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 24 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: LANDING_EASE } },
            }}
            className="mt-8 max-w-xl text-base leading-relaxed text-[#525866] sm:text-lg"
          >
            Exur understands the markets, learns your financial life, and helps you make
            better decisions with your money — today, and eventually on your behalf.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: LANDING_EASE } },
            }}
            className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4"
          >
            <Button
              type="button"
              onClick={() => scrollToSection("meet-exur")}
              className="group h-auto gap-2 rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(37,99,235,0.35)] hover:bg-[#1D4ED8] sm:px-7 sm:py-3.5"
            >
              Meet Exur
              <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => scrollToSection("how-it-works")}
              className="group h-auto gap-2 rounded-full border-black/15 bg-transparent px-6 py-3 text-sm font-semibold text-[#0F172A] hover:border-[#2563EB]/50 hover:bg-transparent hover:text-[#2563EB] sm:px-7 sm:py-3.5"
            >
              See How It Works
              <ChevronDownIcon className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: LANDING_EASE }}
          className="lg:col-span-6"
        >
          <div className="mx-auto w-full max-w-[560px]">
            <div className="relative aspect-square">
              <div className="absolute top-1 left-1 z-20 font-mono text-[10px] uppercase tracking-[0.25em] text-[#868C98]">
                Exur Core · Live
              </div>
              <div className="absolute top-1 right-1 z-20 flex items-center gap-1.5">
                <span className="size-1.5 animate-pulse-dot rounded-full bg-[#2563EB]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#868C98]">
                  Watching
                </span>
              </div>

              <MarketNetwork active={activeNode} onSelect={setActiveNode} />

              <div className="absolute right-1 bottom-2 z-20 hidden font-mono text-[10px] uppercase tracking-[0.25em] text-[#868C98] lg:block">
                Hover the nodes
              </div>

              <div className="absolute -bottom-2 -left-4 z-20 hidden w-[min(100%,300px)] lg:block">
                <NodeDetailCard node={activeNode} />
              </div>
            </div>

            <div className="mt-4 lg:hidden">
              <NodeDetailCard node={activeNode} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
