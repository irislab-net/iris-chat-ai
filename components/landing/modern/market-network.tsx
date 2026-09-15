"use client"

import { useMemo } from "react"

import type { MarketNode } from "@/lib/landing-modern-data"
import { MARKET_NODES } from "@/lib/landing-modern-data"

type MarketNetworkProps = {
  active: MarketNode
  onSelect: (node: MarketNode) => void
}

const CENTER = { x: 50, y: 50 }
const ORBIT_RADII = [18, 28, 38]
const NODE_RADIUS = 3.6
const NODE_HIT_RADIUS = 6.2

function seededParticles(seed = 42) {
  let state = seed
  const rand = () => {
    state = (1831565813 + (state | 0)) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return Array.from({ length: 12 }, (_, i) => {
    const angle = rand() * Math.PI * 2
    const radius = 20 + 22 * rand()
    return {
      id: i,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      r: 0.35 + 0.55 * rand(),
      opacity: 0.18 + 0.28 * rand(),
    }
  })
}

function handleNodeKeyDown(
  event: React.KeyboardEvent,
  node: MarketNode,
  onSelect: (node: MarketNode) => void
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    onSelect(node)
  }
}

export function MarketNetwork({ active, onSelect }: MarketNetworkProps) {
  const particles = useMemo(() => seededParticles(), [])
  const activeId = active.id

  return (
    <div
      className="relative h-full w-full overflow-visible"
      data-testid="market-network"
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <radialGradient id="network-wash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.07" />
            <stop offset="55%" stopColor="#7C3AED" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="core-fill" cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#DBEAFE" />
            <stop offset="45%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.85" />
          </radialGradient>

          <linearGradient id="spoke-idle" x1="50%" y1="50%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.06" />
          </linearGradient>

          <linearGradient id="spoke-active" x1="50%" y1="50%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.35" />
          </linearGradient>

          <filter id="core-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="50" cy="50" r="46" fill="url(#network-wash)" />

        {ORBIT_RADII.map((radius, index) => (
          <circle
            key={radius}
            cx={CENTER.x}
            cy={CENTER.y}
            r={radius}
            fill="none"
            stroke="#2563EB"
            strokeOpacity={index === 0 ? 0.14 : index === 1 ? 0.1 : 0.07}
            strokeWidth={0.35}
            strokeDasharray={index === 1 ? "1.2 2.4" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {particles.map((particle) => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            fill="#2563EB"
            opacity={particle.opacity}
          />
        ))}

        {MARKET_NODES.map((node) => {
          const isActive = node.id === activeId
          return (
            <line
              key={`spoke-${node.id}`}
              x1={CENTER.x}
              y1={CENTER.y}
              x2={node.pos[0]}
              y2={node.pos[1]}
              stroke={isActive ? "url(#spoke-active)" : "url(#spoke-idle)"}
              strokeWidth={isActive ? 0.45 : 0.28}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-500 ease-out"
            />
          )
        })}

        <g filter="url(#core-glow)">
          <circle cx={CENTER.x} cy={CENTER.y} r={7.2} fill="url(#core-fill)" />
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={7.2}
            fill="none"
            stroke="#2563EB"
            strokeOpacity={0.25}
            strokeWidth={0.4}
            vectorEffect="non-scaling-stroke"
          />
        </g>
        <circle cx={CENTER.x} cy={CENTER.y} r={2.8} fill="white" fillOpacity={0.92} />

        {MARKET_NODES.map((node) => {
          const isActive = node.id === activeId
          const [x, y] = node.pos

          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              data-testid={`market-node-${node.id}`}
              aria-label={node.label}
              aria-pressed={isActive}
              className="cursor-pointer outline-none"
              onMouseEnter={() => onSelect(node)}
              onFocus={() => onSelect(node)}
              onClick={() => onSelect(node)}
              onKeyDown={(event) => handleNodeKeyDown(event, node, onSelect)}
            >
              {isActive && (
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS + 4.2}
                  fill="#2563EB"
                  fillOpacity={0.08}
                  className="market-node-pulse"
                />
              )}

              <circle
                cx={x}
                cy={y}
                r={NODE_HIT_RADIUS}
                fill="transparent"
              />

              <circle
                cx={x}
                cy={y}
                r={NODE_RADIUS}
                fill={isActive ? "#2563EB" : "#FFFFFF"}
                stroke="#2563EB"
                strokeOpacity={isActive ? 1 : 0.45}
                strokeWidth={0.55}
                filter={isActive ? "url(#node-glow)" : undefined}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-300 ease-out"
              />

              <circle
                cx={x}
                cy={y}
                r={1.35}
                fill={isActive ? "#FFFFFF" : "#2563EB"}
                fillOpacity={isActive ? 0.95 : 0.7}
                className="transition-all duration-300 ease-out"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
