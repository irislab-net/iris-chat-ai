"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const
const CX = 32
const CY = 32

const glassShellIdleClass = [
  "border border-white/80 dark:border-white/10",
  "bg-white/72 supports-[backdrop-filter]:bg-white/48",
  "backdrop-blur-[28px] backdrop-saturate-[180%]",
  "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_10px_28px_-12px_rgba(15,23,42,0.16),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.65),inset_0_-10px_20px_-12px_rgba(15,23,42,0.08)]",
  "dark:bg-white/10 dark:supports-[backdrop-filter]:bg-white/7",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_10px_28px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.14),inset_0_0_0_0.5px_rgba(255,255,255,0.08),inset_0_-12px_22px_-12px_rgba(0,0,0,0.4)]",
].join(" ")

const glassShellActiveClass = [
  "border border-white/70 dark:border-[#60A5FA]/30",
  "bg-[#2563EB]/14 supports-[backdrop-filter]:bg-[#2563EB]/16",
  "backdrop-blur-[28px] backdrop-saturate-[190%]",
  "shadow-[0_1px_2px_rgba(37,99,235,0.12),0_12px_32px_-12px_rgba(37,99,235,0.38),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-10px_22px_-12px_rgba(37,99,235,0.18)]",
  "dark:bg-[#2563EB]/22 dark:supports-[backdrop-filter]:bg-[#2563EB]/18",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_32px_-12px_rgba(37,99,235,0.45),inset_0_1px_0_0_rgba(255,255,255,0.22),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_-12px_22px_-12px_rgba(0,0,0,0.42)]",
].join(" ")

type AutoTradeStatusVizProps = {
  active: boolean
  className?: string
}

/**
 * Liquid-glass mint orb: dormant frost when paused, live signal core when trading.
 * Inner orbital pulse sits in the blue disc; minted coins float in an overlay.
 */
function AutoTradeStatusViz({ active, className }: AutoTradeStatusVizProps) {
  const reduceMotion = useReducedMotion()
  const instant = Boolean(reduceMotion)
  const uid = React.useId().replace(/:/g, "")
  const faceId = `atv-face-${uid}`
  const rimId = `atv-rim-${uid}`
  const coreId = `atv-core-${uid}`
  const highlightId = `atv-hl-${uid}`
  const beamId = `atv-beam-${uid}`
  const softGlowId = `atv-soft-${uid}`
  const liquidId = `atv-liquid-${uid}`
  const pulseId = `atv-pulse-${uid}`
  const arcId = `atv-arc-${uid}`
  const dashShineId = `atv-dash-${uid}`
  const dashGlowId = `atv-dglow-${uid}`
  const floatFaceId = `atv-fface-${uid}`
  const floatRimId = `atv-frim-${uid}`
  const floatCoreId = `atv-fcore-${uid}`
  const floatHlId = `atv-fhl-${uid}`

  return (
    <div
      className={cn(
        "relative size-15 shrink-0 overflow-visible sm:size-[4.25rem]",
        className
      )}
      aria-hidden
    >
      {/* Glass orb — fixed footprint */}
      <div
        className={cn(
          "absolute inset-0 isolate overflow-hidden rounded-full",
          "transition-[background-color,box-shadow,border-color] duration-500 ease-out",
          active ? glassShellActiveClass : glassShellIdleClass
        )}
      >
        <span
          className={cn(
            landingGlassSheen,
            "rounded-full",
            active && "opacity-90"
          )}
        />

        <span
          className={cn(
            "pointer-events-none absolute inset-x-[18%] top-[10%] z-[1] h-[22%] rounded-[100%]",
            "bg-linear-to-b from-white/85 via-white/25 to-transparent",
            "dark:from-white/22 dark:via-white/6 dark:to-transparent",
            active && "from-white/90 via-[#DBEAFE]/35"
          )}
        />

        <span
          className={cn(
            "pointer-events-none absolute inset-x-[22%] bottom-[14%] z-[1] h-[28%] rounded-[100%] blur-[5px]",
            active
              ? "bg-[#2563EB]/22 dark:bg-[#60A5FA]/18"
              : "bg-slate-400/12 dark:bg-white/5"
          )}
        />

        {active && !instant ? (
          <span className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-full">
            <span
              className={cn(
                "absolute inset-y-[-14%] left-0 w-[58%]",
                "bg-linear-to-r from-transparent via-white/50 to-transparent",
                "animate-exur-logo-shimmer will-change-transform",
                "dark:via-white/30"
              )}
            />
          </span>
        ) : null}

        <svg
          viewBox="0 0 64 64"
          className="relative z-10 size-full"
          focusable="false"
        >
          <defs>
            <linearGradient id={faceId} x1="0.15" y1="0" x2="0.9" y2="1">
              <stop
                offset="0%"
                stopColor={
                  active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.78)"
                }
              />
              <stop
                offset="38%"
                stopColor={
                  active ? "rgba(191,219,254,0.88)" : "rgba(226,232,240,0.55)"
                }
              />
              <stop
                offset="72%"
                stopColor={
                  active ? "rgba(96,165,250,0.78)" : "rgba(148,163,184,0.42)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  active ? "rgba(37,99,235,0.82)" : "rgba(100,116,139,0.48)"
                }
              />
            </linearGradient>
            <linearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop
                offset="100%"
                stopColor={
                  active ? "rgba(147,197,253,0.45)" : "rgba(255,255,255,0.18)"
                }
              />
            </linearGradient>
            <radialGradient id={coreId} cx="35%" cy="30%" r="70%">
              <stop
                offset="0%"
                stopColor={
                  active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)"
                }
              />
              <stop
                offset="55%"
                stopColor={
                  active ? "rgba(147,197,253,0.55)" : "rgba(203,213,225,0.28)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  active ? "rgba(37,99,235,0.35)" : "rgba(148,163,184,0.2)"
                }
              />
            </radialGradient>
            <linearGradient id={highlightId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id={beamId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(37,99,235,0)" />
              <stop
                offset="45%"
                stopColor={
                  active ? "rgba(147,197,253,0.28)" : "rgba(255,255,255,0.04)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)"
                }
              />
            </linearGradient>
            <radialGradient id={liquidId} cx="50%" cy="45%" r="55%">
              <stop
                offset="0%"
                stopColor={
                  active ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.1)"
                }
              />
              <stop offset="100%" stopColor="rgba(37,99,235,0)" />
            </radialGradient>
            <radialGradient id={pulseId} cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor={
                  active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)"
                }
              />
              <stop
                offset="45%"
                stopColor={
                  active ? "rgba(147,197,253,0.55)" : "rgba(203,213,225,0.2)"
                }
              />
              <stop offset="100%" stopColor="rgba(37,99,235,0)" />
            </radialGradient>
            <linearGradient id={arcId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop
                offset="35%"
                stopColor={
                  active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  active ? "rgba(96,165,250,0.15)" : "rgba(148,163,184,0.08)"
                }
              />
            </linearGradient>
            <linearGradient id={dashShineId} x1="0" y1="0" x2="1" y2="1">
              <stop
                offset="0%"
                stopColor={
                  active ? "rgba(37,99,235,0.35)" : "rgba(96,165,250,0.18)"
                }
              />
              <stop
                offset="32%"
                stopColor={
                  active ? "rgba(147,197,253,0.95)" : "rgba(147,197,253,0.4)"
                }
              />
              <stop
                offset="58%"
                stopColor={
                  active ? "rgba(96,165,250,0.9)" : "rgba(96,165,250,0.35)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  active ? "rgba(37,99,235,0.45)" : "rgba(59,130,246,0.16)"
                }
              />
            </linearGradient>
            <filter
              id={softGlowId}
              x="-70%"
              y="-70%"
              width="240%"
              height="240%"
            >
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id={dashGlowId}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="1.1" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <motion.ellipse
            cx={CX}
            cy={CY}
            rx="22"
            ry="17"
            fill={`url(#${liquidId})`}
            animate={
              active && !instant
                ? { opacity: [0.5, 0.9, 0.5] }
                : { opacity: active ? 0.75 : 0.35 }
            }
            transition={
              active && !instant
                ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.4 }
            }
          />

          <motion.rect
            x={CX - 6}
            y={CY - 22}
            width="12"
            height="22"
            rx="6"
            fill={`url(#${beamId})`}
            initial={false}
            animate={{
              opacity: active ? 1 : 0.18,
              scaleY: active ? 1 : 0.4,
            }}
            transition={{ duration: instant ? 0 : 0.5, ease: EASE }}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          />

          <motion.g
            filter={active ? `url(#${dashGlowId})` : undefined}
            animate={active && !instant ? { rotate: 360 } : { rotate: 0 }}
            transition={
              active && !instant
                ? { duration: 5.2, repeat: Infinity, ease: "linear" }
                : { duration: 0.45 }
            }
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          >
            <circle
              cx={CX}
              cy={CY}
              r="26"
              fill="none"
              stroke={
                active ? "rgba(37,99,235,0.3)" : "rgba(96,165,250,0.16)"
              }
              strokeWidth="0.4"
              strokeDasharray={active ? "2.5 6" : "1.8 7"}
              strokeLinecap="round"
            />
            <circle
              cx={CX}
              cy={CY}
              r="26"
              fill="none"
              stroke={`url(#${dashShineId})`}
              strokeWidth={active ? 0.5 : 0.4}
              strokeDasharray={active ? "2.5 6" : "1.8 7"}
              strokeLinecap="round"
              opacity={active ? 1 : 0.7}
            />
          </motion.g>

          {!active ? (
            <g>
              {(
                [
                  [CX - 9, CY - 20],
                  [CX, CY - 23],
                  [CX + 9, CY - 20],
                ] as const
              ).map(([x, y], i) => (
                <motion.line
                  key={`idle-${i}`}
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={y + 5}
                  stroke="rgba(255,255,255,0.42)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  animate={
                    instant
                      ? { opacity: 0.4 }
                      : { opacity: [0.18, 0.48, 0.18] }
                  }
                  transition={
                    instant
                      ? undefined
                      : {
                          duration: 2.8,
                          delay: i * 0.35,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                  }
                />
              ))}
            </g>
          ) : null}

          <motion.g
            filter={`url(#${softGlowId})`}
            animate={
              active && !instant
                ? {
                    transform: [
                      `translate(${CX}px, ${CY}px) scale(1)`,
                      `translate(${CX}px, ${CY - 0.8}px) scale(1.04)`,
                      `translate(${CX}px, ${CY}px) scale(1)`,
                    ],
                  }
                : { transform: `translate(${CX}px, ${CY}px) scale(1)` }
            }
            transition={
              active && !instant
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.4, ease: EASE }
            }
          >
            <GlassDisc
              r={22.5}
              faceId={faceId}
              rimId={rimId}
              coreId={coreId}
              highlightId={highlightId}
              bright={active}
              muted={!active}
            />
            <SignalCore
              active={active}
              instant={instant}
              pulseId={pulseId}
              arcId={arcId}
            />
          </motion.g>

          {active && !instant
            ? (
                [
                  [CX - 16, CY - 8, 0.15],
                  [CX + 16, CY - 9, 0.85],
                  [CX, CY - 22, 1.35],
                ] as const
              ).map(([cx, cy, delay], i) => (
                <motion.circle
                  key={`spark-${i}`}
                  cx={cx}
                  cy={cy}
                  r={1.4}
                  fill="rgba(255,255,255,0.95)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.25, 1.25, 0.35] }}
                  transition={{
                    duration: 1.4,
                    delay,
                    repeat: Infinity,
                    repeatDelay: 1.05,
                    ease: "easeInOut",
                  }}
                />
              ))
            : null}
        </svg>
      </div>

      {/* Floating mint coins — same path; overflow so they can peek above the orb */}
      {active ? (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
          <svg
            viewBox="0 0 64 64"
            className="size-full overflow-visible"
            overflow="visible"
            focusable="false"
          >
            <defs>
              <linearGradient id={floatFaceId} x1="0.15" y1="0" x2="0.9" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="40%" stopColor="rgba(191,219,254,0.9)" />
                <stop offset="100%" stopColor="rgba(37,99,235,0.85)" />
              </linearGradient>
              <linearGradient id={floatRimId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                <stop offset="100%" stopColor="rgba(147,197,253,0.35)" />
              </linearGradient>
              <radialGradient id={floatCoreId} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="100%" stopColor="rgba(96,165,250,0.45)" />
              </radialGradient>
              <linearGradient id={floatHlId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            {(
              [
                { x: 32, delay: 0, drift: -2 },
                { x: 22, delay: 1.2, drift: 2 },
                { x: 42, delay: 2.4, drift: -1 },
              ] as const
            ).map((coin, i) => (
              <motion.g
                key={`float-${i}`}
                initial={{
                  opacity: 0,
                  transform: `translate(${coin.x}px, 40px) scale(0.65)`,
                }}
                animate={
                  instant
                    ? {
                        opacity: 0,
                        transform: `translate(${coin.x}px, 10px) scale(0.85)`,
                      }
                    : {
                        opacity: [0, 0.85, 0],
                        transform: [
                          `translate(${coin.x}px, 40px) scale(0.65)`,
                          `translate(${coin.x + coin.drift}px, 18px) scale(1)`,
                          `translate(${coin.x + coin.drift * 2}px, 4px) scale(0.7)`,
                        ],
                      }
                }
                transition={
                  instant
                    ? { duration: 0 }
                    : {
                        duration: 4.2,
                        delay: coin.delay,
                        repeat: Infinity,
                        repeatDelay: 0.8,
                        ease: EASE,
                        times: [0, 0.45, 1],
                      }
                }
                style={{ willChange: "transform, opacity" }}
              >
                <GlassCoin
                  r={9}
                  faceId={floatFaceId}
                  rimId={floatRimId}
                  coreId={floatCoreId}
                  highlightId={floatHlId}
                  bright
                />
              </motion.g>
            ))}
          </svg>
        </div>
      ) : null}
    </div>
  )
}

/** Minimal signal core: breathing nucleus + thin orbital arcs. */
function SignalCore({
  active,
  instant,
  pulseId,
  arcId,
}: {
  active: boolean
  instant: boolean
  pulseId: string
  arcId: string
}) {
  return (
    <g>
      {/* Soft halo rings */}
      {[10.5, 14.5].map((r, i) => (
        <motion.circle
          key={`halo-${r}`}
          cx={0}
          cy={0}
          r={r}
          fill="none"
          stroke={
            active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)"
          }
          strokeWidth={0.7}
          initial={false}
          animate={
            active && !instant
              ? { opacity: [0.2, 0.55, 0.2], scale: [0.96, 1.04, 0.96] }
              : { opacity: active ? 0.4 : 0.18, scale: 1 }
          }
          transition={
            active && !instant
              ? {
                  duration: 2.8,
                  delay: i * 0.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0.4 }
          }
        />
      ))}

      {/* Sweeping orbital arcs — opposite directions */}
      <motion.circle
        cx={0}
        cy={0}
        r={12.5}
        fill="none"
        stroke={`url(#${arcId})`}
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeDasharray="14 64"
        animate={
          active && !instant
            ? { rotate: 360, opacity: 1 }
            : { rotate: 40, opacity: active ? 0.7 : 0.28 }
        }
        transition={
          active && !instant
            ? { duration: 3.6, repeat: Infinity, ease: "linear" }
            : { duration: 0.45, ease: EASE }
        }
      />
      <motion.circle
        cx={0}
        cy={0}
        r={16.2}
        fill="none"
        stroke={`url(#${arcId})`}
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeDasharray="10 72"
        animate={
          active && !instant
            ? { rotate: -360, opacity: 0.85 }
            : { rotate: -55, opacity: active ? 0.55 : 0.2 }
        }
        transition={
          active && !instant
            ? { duration: 5.4, repeat: Infinity, ease: "linear" }
            : { duration: 0.45, ease: EASE }
        }
      />

      {/* Tiny orbiting nodes */}
      {(
        [
          { r: 12.5, dur: 3.6, delay: 0, size: 1.35, reverse: false },
          { r: 16.2, dur: 5.4, delay: 0.4, size: 1.1, reverse: true },
        ] as const
      ).map((node, i) => (
        <motion.g
          key={`node-${i}`}
          animate={
            active && !instant
              ? { rotate: node.reverse ? -360 : 360 }
              : { rotate: node.reverse ? -55 : 40 }
          }
          transition={
            active && !instant
              ? {
                  duration: node.dur,
                  delay: node.delay,
                  repeat: Infinity,
                  ease: "linear",
                }
              : { duration: 0.45, ease: EASE }
          }
        >
          <motion.circle
            cx={node.r}
            cy={0}
            r={node.size}
            fill="rgba(255,255,255,0.95)"
            animate={
              active && !instant
                ? { opacity: [0.45, 1, 0.45] }
                : { opacity: active ? 0.75 : 0.3 }
            }
            transition={
              active && !instant
                ? {
                    duration: 1.6,
                    delay: node.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : { duration: 0.35 }
            }
          />
        </motion.g>
      ))}

      {/* Breathing nucleus */}
      <motion.circle
        cx={0}
        cy={0}
        r={5.5}
        fill={`url(#${pulseId})`}
        animate={
          active && !instant
            ? { scale: [0.88, 1.12, 0.88], opacity: [0.75, 1, 0.75] }
            : { scale: 1, opacity: active ? 0.9 : 0.45 }
        }
        transition={
          active && !instant
            ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.4, ease: EASE }
        }
      />
      <circle
        cx={0}
        cy={0}
        r={2.2}
        fill={active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)"}
        opacity={active ? 0.95 : 0.55}
      />
    </g>
  )
}

function GlassDisc({
  r,
  faceId,
  rimId,
  coreId,
  highlightId,
  bright = false,
  muted = false,
}: {
  r: number
  faceId: string
  rimId: string
  coreId: string
  highlightId: string
  bright?: boolean
  muted?: boolean
}) {
  return (
    <g>
      <ellipse
        cx={0.3}
        cy={1.1}
        rx={r}
        ry={r * 0.86}
        fill={`url(#${rimId})`}
        opacity={muted ? 0.18 : 0.32}
      />
      <circle cx={0} cy={0} r={r} fill={`url(#${faceId})`} />
      <circle
        cx={0}
        cy={0}
        r={r * 0.78}
        fill={`url(#${coreId})`}
        opacity={muted ? 0.55 : 0.85}
      />
      <circle
        cx={0}
        cy={0}
        r={r * 0.78}
        fill="none"
        stroke={
          muted
            ? "rgba(255,255,255,0.18)"
            : bright
              ? "rgba(255,255,255,0.32)"
              : "rgba(255,255,255,0.22)"
        }
        strokeWidth={1}
      />
      <ellipse
        cx={-r * 0.28}
        cy={-r * 0.32}
        rx={r * 0.4}
        ry={r * 0.26}
        fill={`url(#${highlightId})`}
        opacity={muted ? 0.35 : 0.55}
      />
    </g>
  )
}

function GlassCoin({
  r,
  faceId,
  rimId,
  coreId,
  highlightId,
  bright = false,
  muted = false,
}: {
  r: number
  faceId: string
  rimId: string
  coreId: string
  highlightId: string
  bright?: boolean
  muted?: boolean
}) {
  return (
    <g>
      <ellipse
        cx={0.3}
        cy={1.1}
        rx={r}
        ry={r * 0.86}
        fill={`url(#${rimId})`}
        opacity={muted ? 0.18 : 0.32}
      />
      <circle cx={0} cy={0} r={r} fill={`url(#${faceId})`} />
      <circle
        cx={0}
        cy={0}
        r={r * 0.78}
        fill={`url(#${coreId})`}
        opacity={muted ? 0.55 : 0.85}
      />
      <circle
        cx={0}
        cy={0}
        r={r * 0.78}
        fill="none"
        stroke={
          muted
            ? "rgba(255,255,255,0.18)"
            : bright
              ? "rgba(255,255,255,0.32)"
              : "rgba(255,255,255,0.22)"
        }
        strokeWidth={1}
      />
      <ellipse
        cx={-r * 0.28}
        cy={-r * 0.32}
        rx={r * 0.4}
        ry={r * 0.26}
        fill={`url(#${highlightId})`}
        opacity={muted ? 0.35 : 0.72}
      />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={
          muted
            ? "rgba(255,255,255,0.5)"
            : bright
              ? "rgba(255,255,255,0.95)"
              : "rgba(255,255,255,0.78)"
        }
        fontSize={r * 0.92}
        fontWeight={600}
        fontFamily="ui-rounded, system-ui, sans-serif"
      >
        $
      </text>
    </g>
  )
}

export { AutoTradeStatusViz }
