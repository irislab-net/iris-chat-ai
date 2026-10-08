"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

type ChatStakingCoinTreeProps = {
  className?: string
  /** When true, play the grow sequence (remounts via key). */
  active?: boolean
}

/**
 * Coin planted in soil → trunk → branching coin-tree. Soft, cinematic timing.
 */
function ChatStakingCoinTree({
  className,
  active = true,
}: ChatStakingCoinTreeProps) {
  const reduceMotion = useReducedMotion()
  const instant = Boolean(reduceMotion)
  // Remount SVG when the sheet opens so the sequence replays without setState-in-effect.
  const playKey = active ? "play" : "idle"

  return (
    <div
      className={cn(
        "relative mx-auto flex h-[13.5rem] w-full max-w-[17rem] items-end justify-center",
        className
      )}
    >
      <svg
        key={playKey}
        viewBox="0 0 200 180"
        className="h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="staking-coin-face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.28)" />
          </linearGradient>
          <linearGradient id="staking-coin-rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
          <linearGradient id="staking-trunk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.22)" />
          </linearGradient>
          <radialGradient id="staking-soil" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.38)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter
            id="staking-soft-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse
          cx="100"
          cy="158"
          rx="72"
          ry="14"
          fill="url(#staking-soil)"
        />
        <path
          d="M28 158c18-10 40-16 72-16s54 6 72 16"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <motion.path
          d="M100 148 C98 120 97 96 100 72"
          fill="none"
          stroke="url(#staking-trunk)"
          strokeWidth="3.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{
            duration: instant ? 0 : 0.85,
            delay: instant ? 0 : 0.55,
            ease: EASE,
          }}
        />

        {(
          [
            ["M100 108 C78 102 62 94 48 86", 0.85],
            ["M100 108 C122 102 138 94 152 86", 0.95],
            ["M100 90 C82 82 68 72 54 62", 1.05],
            ["M100 90 C118 82 132 72 146 62", 1.15],
            ["M100 78 C90 68 82 56 76 46", 1.25],
            ["M100 78 C110 68 118 56 124 46", 1.35],
          ] as const
        ).map(([d, delay], i) => (
          <motion.path
            key={`b-${i}`}
            d={d}
            fill="none"
            stroke="url(#staking-trunk)"
            strokeWidth={i < 2 ? 2.2 : 1.7}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.75 }}
            transition={{
              duration: instant ? 0 : 0.7,
              delay: instant ? 0 : delay,
              ease: EASE,
            }}
          />
        ))}

        <motion.g
          filter="url(#staking-soft-glow)"
          initial={{
            opacity: 0,
            transform: "translate(100px, 16px) scale(0.5)",
          }}
          animate={{
            opacity: 1,
            transform: instant
              ? "translate(100px, 146px) scale(0.7)"
              : [
                  "translate(100px, 16px) scale(0.5)",
                  "translate(100px, 148px) scale(0.88)",
                  "translate(100px, 146px) scale(0.7)",
                ],
          }}
          transition={{
            duration: instant ? 0 : 0.75,
            times: instant ? undefined : [0, 0.75, 1],
            ease: EASE,
          }}
        >
          <CoinGlyph r={11} />
        </motion.g>

        {(
          [
            [48, 86, 0.95, 9],
            [152, 86, 1.05, 9],
            [54, 62, 1.2, 10],
            [146, 62, 1.3, 10],
            [76, 46, 1.4, 11],
            [124, 46, 1.5, 11],
            [100, 36, 1.65, 13],
          ] as const
        ).map(([cx, cy, delay, r], i) => (
          <motion.g
            key={`c-${i}`}
            filter="url(#staking-soft-glow)"
            initial={{
              opacity: 0,
              transform: `translate(${cx}px, ${cy}px) scale(0)`,
            }}
            animate={{
              opacity: 1,
              transform: `translate(${cx}px, ${cy}px) scale(1)`,
            }}
            transition={{
              type: "spring",
              stiffness: instant ? 420 : 260,
              damping: 15,
              mass: 0.65,
              delay: instant ? 0 : delay,
            }}
          >
            <CoinGlyph r={r} />
          </motion.g>
        ))}

        {!instant
          ? (
              [
                [70, 52, 1.7],
                [130, 48, 1.85],
                [100, 24, 2.05],
              ] as const
            ).map(([cx, cy, delay], i) => (
              <motion.circle
                key={`s-${i}`}
                cx={cx}
                cy={cy}
                r={1.6}
                fill="rgba(255,255,255,0.9)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1.35, 0.5] }}
                transition={{
                  duration: 1.45,
                  delay,
                  repeat: Infinity,
                  repeatDelay: 1.9,
                  ease: "easeInOut",
                }}
              />
            ))
          : null}
      </svg>
    </div>
  )
}

function CoinGlyph({ r }: { r: number }) {
  return (
    <g>
      <ellipse
        cx={0}
        cy={1.15}
        rx={r}
        ry={r * 0.9}
        fill="url(#staking-coin-rim)"
        opacity={0.35}
      />
      <circle cx={0} cy={0} r={r} fill="url(#staking-coin-face)" />
      <circle
        cx={0}
        cy={0}
        r={r * 0.72}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.05}
      />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.72)"
        fontSize={r * 0.92}
        fontWeight={500}
        fontFamily="ui-rounded, system-ui, sans-serif"
      >
        $
      </text>
    </g>
  )
}

export { ChatStakingCoinTree }
