"use client"

import { useLayoutEffect, useRef } from "react"
import { useTranslations } from "next-intl"

import styles from "@/components/landing/modern/goals-story.module.css"
import {
  GOALS_STORY_POOL_SIZE,
  initGoalsStory,
} from "@/lib/goals-story-engine"
import { GOALS_STORY_COUNT } from "@/lib/landing-modern-data"
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
  const t = useTranslations("modern.goals")
  const storyRef = useRef<HTMLDivElement>(null)
  const blocksRef = useRef<HTMLDivElement>(null)
  const barsRef = useRef<HTMLDivElement>(null)
  const poolRef = useRef<SVGGElement>(null)
  const pingsRef = useRef<SVGGElement>(null)
  const pg1Ref = useRef<SVGCircleElement>(null)
  const pg2Ref = useRef<SVGCircleElement>(null)
  const pings4Ref = useRef<SVGGElement>(null)

  useLayoutEffect(() => {
    const story = storyRef.current
    const blocksRoot = blocksRef.current
    const barsRoot = barsRef.current
    const pool = poolRef.current
    const pings = pingsRef.current
    const pg1 = pg1Ref.current
    const pg2 = pg2Ref.current
    const pings4 = pings4Ref.current

    if (!story || !blocksRoot || !barsRoot || !pool || !pings || !pg1 || !pg2 || !pings4) {
      return
    }

    const blocks = Array.from(blocksRoot.querySelectorAll<HTMLElement>("[data-story-block]"))
    const bars = Array.from(barsRoot.querySelectorAll<HTMLElement>("[data-story-bar]"))
    const poolEls = Array.from(pool.querySelectorAll<SVGCircleElement>("circle"))

    if (
      blocks.length !== GOALS_STORY_COUNT ||
      bars.length !== GOALS_STORY_COUNT ||
      poolEls.length !== GOALS_STORY_POOL_SIZE
    ) {
      return
    }

    return initGoalsStory({
      story,
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
              {/* Animated blocks are decorative; full story stays available to assistive tech. */}
              <ol className="sr-only">
                {Array.from({ length: GOALS_STORY_COUNT }, (_, index) => (
                  <li key={index}>
                    <h2>{t(`${index}.heading`)}</h2>
                    <p>{t(`${index}.sub`)}</p>
                  </li>
                ))}
              </ol>
              <div ref={blocksRef} className={styles.blocks} aria-hidden="true">
                {Array.from({ length: GOALS_STORY_COUNT }, (_, index) => (
                  <div
                    key={index}
                    data-story-block
                    className={styles.block}
                  >
                    <p
                      className={cn(
                        styles.heading,
                        landingTitleSection,
                        "text-center xl:text-start"
                      )}
                    >
                      {t(`${index}.heading`)}
                    </p>
                    <p
                      className={cn(
                        styles.sub,
                        landingSubheading,
                        "mx-0 mt-0 max-w-none text-center text-lg xl:text-start"
                      )}
                    >
                      {t(`${index}.sub`)}
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
                {Array.from({ length: GOALS_STORY_COUNT }, (_, index) => (
                  <span key={index} data-story-bar className={styles.bar} />
                ))}
              </div>
            </div>

            <figure
              className={cn(landingGlassSurface, styles.tile, "relative bg-white/42 dark:bg-white/8")}
              aria-label={t("diagramAria")}
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
        </div>
      </div>
    </section>
  )
}
