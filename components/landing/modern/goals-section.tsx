"use client"

import { useLayoutEffect, useRef } from "react"

import styles from "@/components/landing/modern/goals-story.module.css"
import {
  GOALS_STORY_COPY,
  GOALS_STORY_POOL_SIZE,
  initGoalsStory,
} from "@/lib/goals-story-engine"
import {
  landingGlassSheen,
  landingGlassSurface,
  landingInner,
  landingSection,
  landingSubheading,
  landingTitleSection,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export function GoalsSection() {
  const storyRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const blocksRef = useRef<HTMLDivElement>(null)
  const barsRef = useRef<HTMLDivElement>(null)
  const poolRef = useRef<SVGGElement>(null)
  const pingsRef = useRef<SVGGElement>(null)
  const pg1Ref = useRef<SVGCircleElement>(null)
  const pg2Ref = useRef<SVGCircleElement>(null)
  const pings4Ref = useRef<SVGGElement>(null)

  useLayoutEffect(() => {
    const story = storyRef.current
    const hint = hintRef.current
    const blocksRoot = blocksRef.current
    const barsRoot = barsRef.current
    const pool = poolRef.current
    const pings = pingsRef.current
    const pg1 = pg1Ref.current
    const pg2 = pg2Ref.current
    const pings4 = pings4Ref.current

    if (!story || !hint || !blocksRoot || !barsRoot || !pool || !pings || !pg1 || !pg2 || !pings4) {
      return
    }

    const blocks = Array.from(blocksRoot.querySelectorAll<HTMLElement>("[data-story-block]"))
    const bars = Array.from(barsRoot.querySelectorAll<HTMLElement>("[data-story-bar]"))
    const poolEls = Array.from(pool.querySelectorAll<SVGCircleElement>("circle"))

    if (
      blocks.length !== 4 ||
      bars.length !== 4 ||
      poolEls.length !== GOALS_STORY_POOL_SIZE
    ) {
      return
    }

    return initGoalsStory({
      story,
      hint,
      blocks,
      bars,
      poolEls,
      pings,
      pg1,
      pg2,
      pings4,
    })
  }, [])

  return (
    <section
      id="features"
      className={cn(
        landingSection,
        "relative isolate overflow-visible rounded-[2.5rem] pb-16 sm:pb-20 lg:pb-24"
      )}
    >
      <div ref={storyRef} className={styles.story}>
        <div className={styles.stage}>
          <div className={cn(landingInner, styles.inner)}>
            <div>
              <div ref={blocksRef} className={styles.blocks}>
                {GOALS_STORY_COPY.map((copy, index) => (
                  <div
                    key={copy.heading}
                    data-story-block
                    className={styles.block}
                    aria-hidden={index === 0 ? "false" : "true"}
                  >
                    <h2 className={cn(styles.heading, landingTitleSection, "text-left")}>
                      {copy.heading}
                    </h2>
                    <p
                      className={cn(
                        styles.sub,
                        landingSubheading,
                        "mx-0 mt-0 max-w-none text-left text-lg"
                      )}
                    >
                      {copy.sub}
                    </p>
                  </div>
                ))}
              </div>
              <div
                ref={barsRef}
                className={styles.bars}
                role="presentation"
                aria-hidden="true"
              >
                {GOALS_STORY_COPY.map((copy) => (
                  <span key={copy.heading} data-story-bar className={styles.bar} />
                ))}
              </div>
            </div>

            <figure
              className={cn(landingGlassSurface, styles.tile, "relative bg-white/42")}
              aria-label="Circles that change as you scroll: a grid of noise, four scattered accounts, four overlapping choices, then one calm ring"
            >
              <span aria-hidden className={styles.tileBackdrop} />
              <span
                aria-hidden
                className={cn(landingGlassSheen, "absolute inset-0 rounded-[32px]")}
              />
              <svg viewBox="0 0 480 400" aria-hidden="true" className="relative z-10">
                <g ref={pings4Ref} opacity="0">
                  <circle className={styles.ping4} cx="240" cy="206" r="88" />
                  <circle className={cn(styles.ping4, styles.ping4Q2)} cx="240" cy="206" r="88" />
                </g>
                <g ref={pingsRef} opacity="1">
                  <circle ref={pg1Ref} className={styles.ping} cx="184" cy="150" r="27" />
                  <circle
                    ref={pg2Ref}
                    className={cn(styles.ping, styles.pingP2)}
                    cx="184"
                    cy="150"
                    r="27"
                  />
                </g>
                <g ref={poolRef} className={styles.pool}>
                  {Array.from({ length: GOALS_STORY_POOL_SIZE }, (_, i) => (
                    <circle key={i} r="0" />
                  ))}
                </g>
              </svg>
            </figure>
          </div>

          <div ref={hintRef} className={styles.hint}>
            SCROLL
            <span />
          </div>
        </div>
      </div>
    </section>
  )
}
