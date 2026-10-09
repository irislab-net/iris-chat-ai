import { cn } from "@/lib/utils"
import type { AnimationHandle } from "@/types/animation"
import type { CardData } from "@/types/card"
import type { SVGIcon } from "@/types/icon"
import React, { useCallback, useLayoutEffect, useRef } from "react"
import Badges from "./badges"
import GrowingCard from "./growingCard"
import List from "./list"

const Card = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<
    React.ComponentPropsWithoutRef<"div"> & {
      card?: CardData
      icon?: SVGIcon
      title?: string
      description?: string
      bgClassName?: string
      titleClassName?: string
      descriptionClassName?: string
      iconClassName?: string
      listClassName?: string
      contentClassName?: string
      headerClassName?: string
      /** When set with `card.animatedIcon`, plays the icon animation once the card enters the viewport. */
      playAnimatedIconOnView?: boolean
    }
  >
>(
  (
    {
      card,
      className,
      children,
      bgClassName,
      title,
      description,
      titleClassName,
      descriptionClassName,
      iconClassName,
      listClassName,
      contentClassName,
      headerClassName,
      playAnimatedIconOnView = false,
      ...props
    },
    ref
  ) => {
    const iconAnimationRef = useRef<AnimationHandle>(null)
    const cardRootRef = useRef<HTMLDivElement | null>(null)
    const hasPlayedOnViewRef = useRef(false)

    const setCardRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        cardRootRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref]
    )

    useLayoutEffect(() => {
      if (!playAnimatedIconOnView) {
        hasPlayedOnViewRef.current = false
        return
      }
      if (!card?.animatedIcon) return

      const el = cardRootRef.current
      if (!el) return

      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting && !hasPlayedOnViewRef.current) {
            hasPlayedOnViewRef.current = true
            iconAnimationRef.current?.play()
            io.disconnect()
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
      )
      io.observe(el)
      return () => io.disconnect()
    }, [playAnimatedIconOnView, card?.animatedIcon])

    const hasHeader =
      card?.icon || card?.number || card?.title || props.icon || title

    const sharedIconClassName =
      "size-6 group-hover/card:scale-120 group-active/card:scale-120 transition-transform duration-300 delay-100 ease-in-out"

    const handleIconAnimation = () => {
      iconAnimationRef.current?.play()
    }

    return (
      <GrowingCard
        ref={setCardRootRef}
        className={cn("group/card flex flex-col gap-4 p-6", className)}
        bgClassName={cn(bgClassName, card?.bgClassName)}
        onMouseEnter={handleIconAnimation}
        onTouchStart={handleIconAnimation}
        {...props}
      >
        {/* header */}
        {hasHeader && (
          <div className={cn("flex items-start gap-3", headerClassName)}>
            {card?.number && (
              <div
                className={cn(
                  "size-7 min-w-7 rounded-full bg-neutral-600 text-white text-sm flex items-center justify-center font-semibold transition-all duration-300 delay-100 ease-in-out group-hover/card:scale-120",
                  card.numberClassName
                )}
              >
                {card.number}
              </div>
            )}

            {/* icon */}
            {props.icon && !card?.icon && !card?.animatedIcon && (
              <props.icon className={cn(sharedIconClassName, iconClassName)} />
            )}

            {/* card icon */}
            {card?.icon && !props.icon && !card?.animatedIcon && (
              <card.icon
                className={cn(
                  sharedIconClassName,
                  iconClassName,
                  card.iconClassName
                )}
              />
            )}

            {/* animated icon */}
            {card?.animatedIcon && (
              <card.animatedIcon
                ref={iconAnimationRef}
                className={cn(sharedIconClassName, card.iconClassName)}
              />
            )}

            {/* title */}
            {(card?.title || title) && (
              <strong
                className={cn(
                  "text-lg font-bold font-brand font-semibold tracking-tight",
                  titleClassName,
                  card?.titleClassName
                )}
              >
                {card?.title || title}
              </strong>
            )}
          </div>
        )}

        {/* description */}
        {(card?.description || description) && (
          <p
            className={cn(
              "text-neutral-700",
              descriptionClassName,
              card?.descriptionClassName
            )}
          >
            {card?.description || description}
          </p>
        )}

        {/* content */}
        {children && (
          <div className={cn(contentClassName, card?.contentClassName)}>
            {children}
          </div>
        )}

        {/* list */}
        {card?.list && (
          <List
            type={card.listType}
            items={card.list}
            icon={card.listIcon}
            iconClassName={card.listIconClassName}
            className={cn(listClassName, card.listClassName)}
          />
        )}

        {/* badges */}
        {card?.badges && (
          <Badges
            size='sm'
            badges={card.badges}
            badgeClassName={cn("bg-background", card.badgeClassName)}
            className='mt-auto'
          />
        )}
      </GrowingCard>
    )
  }
)

export default Card
