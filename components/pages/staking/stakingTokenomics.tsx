import Card from "@/components/common/card"
import LandingSection from "@/components/common/landingSection"
import SectionHeader from "@/components/common/sectionHeader"
import { cn } from "@/lib/utils"
import {
  ALLOCATION,
  ALLOCATION_FOOTNOTE,
  STRATEGY_SUMMARY,
} from "@/constants/stakingCopy"
import type { CardData } from "@/types/card"
import type { ChartData } from "@/types/chart"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useMemo, useRef, useState } from "react"

const DistributionChart = ({
  chartData,
  activeIndex,
  onSliceClick,
}: {
  chartData: ChartData[]
  activeIndex?: number
  onSliceClick?: (index: number) => void
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const getGrayscaleColor = (index: number, total: number) => {
    const intensity = Math.round((index / (total - 1)) * 200)
    return `rgb(${intensity}, ${intensity}, ${intensity})`
  }

  const getHoverOffset = (index: number) => {
    const percentage = chartData[index].value
    const startAngle = chartData
      .slice(0, index)
      .reduce((acc, item) => acc + item.value, 0)
    const endAngle = startAngle + percentage
    const averageAngle = (startAngle + endAngle) / 2

    // Convert percentage to angle (180-0 degrees for semicircle)
    const averageRad = ((180 - (averageAngle * 180) / 100) * Math.PI) / 180

    // Calculate offset direction (outward from center)
    const offsetX = Math.cos(averageRad) * 5 // 5px outward
    const offsetY = -Math.sin(averageRad) * 5 // 5px outward

    return { offsetX, offsetY }
  }

  const getLabelPosition = (index: number) => {
    const percentage = chartData[index].value
    const startAngle = chartData
      .slice(0, index)
      .reduce((acc, item) => acc + item.value, 0)
    const endAngle = startAngle + percentage
    const averageAngle = (startAngle + endAngle) / 2

    // Convert percentage to angle (180-0 degrees for semicircle)
    const averageRad = ((180 - (averageAngle * 180) / 100) * Math.PI) / 180

    // Calculate label position (outside the circle)
    const labelRadius = 95 // Position outside the circle
    const labelX = 100 + labelRadius * Math.cos(averageRad)
    const labelY = 100 - labelRadius * Math.sin(averageRad)

    return { labelX, labelY }
  }

  const getTextDimensions = (text: string, fontSize: string) => {
    // Create a temporary SVG element to measure text
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    const textElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    )
    textElement.textContent = text
    textElement.style.fontSize = fontSize
    textElement.style.fontFamily = "inherit"
    textElement.style.fontWeight = "inherit"
    svg.appendChild(textElement)
    document.body.appendChild(svg)

    const bbox = textElement.getBBox()
    document.body.removeChild(svg)

    return { width: bbox.width, height: bbox.height }
  }

  return (
    <div className='relative w-64 h-32'>
      <svg viewBox='0 0 200 100' overflow='visible' className='size-full'>
        {chartData.map((item, index) => {
          const percentage = item.value
          const startAngle = chartData
            .slice(0, index)
            .reduce((acc, item) => acc + item.value, 0)
          const endAngle = startAngle + percentage

          // Convert percentages to angles (180-0 degrees for semicircle, starting from left)
          const startRad = ((180 - (startAngle * 180) / 100) * Math.PI) / 180
          const endRad = ((180 - (endAngle * 180) / 100) * Math.PI) / 180

          // Calculate arc path for semicircle
          const radius = 80
          const centerX = 100
          const centerY = 100 // Center at bottom of viewBox

          const x1 = centerX + radius * Math.cos(startRad)
          const y1 = centerY - radius * Math.sin(startRad)
          const x2 = centerX + radius * Math.cos(endRad)
          const y2 = centerY - radius * Math.sin(endRad)

          // For a semicircle chart, slices are always less than 180 degrees
          // The largeArcFlag should always be 0 for semicircle slices
          // (0 = use the smaller arc, 1 = use the larger arc)
          const largeArcFlag = 0

          // Add rounded corners for first and last slices
          const isFirstSlice = index === 0
          const isLastSlice = index === chartData.length - 1
          const cornerRadius = 8

          let pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

          if (isFirstSlice) {
            // Left bottom corner: modify the path to have inward rounded corner at left edge
            const leftEdgeX = centerX - radius
            const leftEdgeY = centerY
            pathData = `M ${centerX} ${centerY} L ${leftEdgeX + cornerRadius
              } ${leftEdgeY} Q ${leftEdgeX} ${leftEdgeY} ${leftEdgeX} ${leftEdgeY - cornerRadius
              } A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
          } else if (isLastSlice) {
            // Right bottom corner: modify the path to have inward rounded corner at right edge
            const rightEdgeX = centerX + radius
            const rightEdgeY = centerY
            pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${rightEdgeX} ${rightEdgeY - cornerRadius
              } Q ${rightEdgeX} ${rightEdgeY} ${rightEdgeX - cornerRadius
              } ${rightEdgeY} Z`
          }

          const { offsetX, offsetY } = getHoverOffset(index)

          return (
            <path
              key={index}
              d={pathData}
              fill={getGrayscaleColor(index, chartData.length)}
              className={cn(
                "opacity-80 hover:opacity-100 transition-all duration-300",
                activeIndex === index && "opacity-100"
              )}
              style={{
                transformOrigin: `${centerX}px ${centerY}px`,
                transform:
                  activeIndex === index
                    ? `translate(${offsetX}px, ${offsetY}px)`
                    : undefined,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = `translate(${offsetX}px, ${offsetY}px)`
                setHoveredIndex(index)
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translate(0px, 0px)"
                setHoveredIndex(null)
              }}
              onClick={() => {
                onSliceClick?.(index)
              }}
            />
          )
        })}

        {/* Labels for all slices */}
        {chartData.map((item, index) => {
          const labelText = item.label
          const percentageText = `${item.value}%`
          const labelPos = getLabelPosition(index)
          const isHovered = hoveredIndex === index || activeIndex === index

          // Get text dimensions for both label and percentage
          const labelDims = getTextDimensions(labelText, "10px")
          const percentageDims = getTextDimensions(percentageText, "8px")

          // Calculate background dimensions
          const padding = 4
          const spacing = 6 // Space between label and percentage
          const bgWidth =
            labelDims.width + percentageDims.width + spacing + padding * 2
          const bgHeight =
            Math.max(labelDims.height, percentageDims.height) + padding * 2

          return (
            <g
              key={`label-${index}`}
              style={{
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.2s ease-in-out",
                pointerEvents: "none",
              }}
            >
              {/* Background container */}
              <rect
                x={labelPos.labelX - bgWidth / 2}
                y={labelPos.labelY - bgHeight / 2}
                width={bgWidth}
                height={bgHeight}
                rx='6'
                ry='6'
                fill='white'
                stroke='gray-200'
                strokeWidth='1'
                style={{
                  opacity: 0.95,
                }}
              />
              {/* Label text */}
              <text
                x={
                  labelPos.labelX -
                  (labelDims.width + spacing + percentageDims.width) / 2 +
                  labelDims.width / 2
                }
                y={labelPos.labelY}
                textAnchor='middle'
                dominantBaseline='middle'
                className='text-xs font-medium fill-gray-800'
                style={{
                  fontSize: "10px",
                  opacity: 1,
                }}
              >
                {labelText}
              </text>
              {/* Percentage text */}
              <text
                x={
                  labelPos.labelX +
                  (labelDims.width + spacing + percentageDims.width) / 2 -
                  percentageDims.width / 2
                }
                y={labelPos.labelY}
                textAnchor='middle'
                dominantBaseline='middle'
                className='text-xs font-medium fill-gray-600'
                style={{
                  fontSize: "8px",
                  opacity: 1,
                }}
              >
                {percentageText}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function StakingTokenomics() {
  const containerRef = useRef<HTMLDivElement>(null)
  const tokenomicsRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline>(null)

  const [inViewCardIndex, setInViewCardIndex] = useState(0)

  const tokenomics: CardData<{ percentage: number }>[] = [
    {
      title: ALLOCATION.rwa.label,
      data: { percentage: ALLOCATION.rwa.percentage },
      description: "Primary execution bucket for market-neutral spread capture.",
    },
    {
      title: ALLOCATION.cex.label,
      data: { percentage: ALLOCATION.cex.percentage },
      description: "Supports deposits, withdrawals, and venue inventory movement.",
    },
    {
      title: ALLOCATION.reserve.label,
      data: { percentage: ALLOCATION.reserve.percentage },
      description: "Supports continuity during changing conditions.",
    },
  ].sort((a, b) => (b.data?.percentage ?? 0) - (a.data?.percentage ?? 0))

  const chartData: ChartData[] = useMemo(() => {
    return tokenomics.map(item => ({
      label: item.title ?? "",
      value: item.data?.percentage ?? 0,
      icon: item.icon,
    }))
  }, [tokenomics])

  useGSAP(
    () => {
      const isMobile = window.innerWidth < 768

      for (let i = 0; i < tokenomics.length; i++) {
        gsap.set(`[data-tokenomics-card='${i}']`, {
          opacity: 0.5,
          y: (i + 1) * 196,
        })
      }

      timelineRef.current = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: tokenomicsRef.current,
          start: isMobile ? "top -250px" : "top 0",
          end: "+=2000",
          scrub: 2,
        },
      })

      const tl = timelineRef.current

      for (let i = 0; i < tokenomics.length; i++) {
        tl.call(() => {
          setInViewCardIndex(i - 1)
        })
          .to(
            `[data-tokenomics-card='${i - 1}']`,
            {
              opacity: 0,
              y: -32,
              duration: 0.5,
              ease: "none",
            },
            "<"
          )
          .to(
            `[data-tokenomics-card='${i}']`,
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "none",
            },
            "<+=0.1"
          )
          .call(
            () => {
              setInViewCardIndex(i)
            },
            [],
            "<"
          )
          .to(
            `[data-tokenomics-card='${i + 1}']`,
            {
              y: 196,
              duration: 1,
              ease: "none",
            },
            "<"
          )
      }
    },
    { scope: tokenomicsRef }
  )

  return (
    <LandingSection ref={containerRef} className='pb-0! space-y-10'>
      <div className='space-y-3'>
        <SectionHeader
          header='How USDM is allocated'
          description={STRATEGY_SUMMARY}
          descriptionClassName='max-w-2xl pe-6 md:max-w-none md:whitespace-nowrap'
        />
        <p className='max-w-2xl text-xs leading-relaxed text-neutral-400 pe-6'>
          {ALLOCATION_FOOTNOTE}
        </p>
      </div>

      <div ref={tokenomicsRef} className='relative grid md:grid-cols-2 gap-8'>
        {/* chart */}
        <div className='py-8 mask-y relative bg-background flex-1 z-10'>
          <div className='flex flex-col items-center gap-2'>
            <DistributionChart
              chartData={chartData}
              activeIndex={inViewCardIndex}
            />
          </div>
        </div>

        {/* tokenomics */}
        <div className='relative flex flex-1 flex-col gap-8 pb-32'>
          <div className='sticky top-68 md:top-32'>
            <div className='relative bg-neutral-50 h-44 rounded-xl'>
              <div className='relative flex flex-col'>
                {tokenomics.map((item, index) => (
                  <div
                    key={index}
                    data-tokenomics-card={index}
                    className='flex absolute left-0 right-0 top-0'
                  >
                    <Card
                      card={item}
                      bgClassName='bg-transparent'
                      className='gap-1 py-12'
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-lg font-bold text-neutral-700'>
                          {item.data?.percentage ?? 0}%
                        </span>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  )
}

export default StakingTokenomics
