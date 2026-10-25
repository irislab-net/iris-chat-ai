"use client"

import { ChevronDownIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { PaymentMethodMark } from "@/components/billing/payment-token-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { chatMobileGlassSurfaceClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import {
  SelectionCheckBadge,
  SelectionCheckSpacer,
} from "@/components/ui/selection-check-badge"
import { PAYMENT_NETWORK, PAYMENT_TOKENS } from "@/lib/billing/payment-options"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type PaymentMethodPickerProps = {
  currency: PaymentCurrency
  disabled?: boolean
  onCurrencyChange: (currency: PaymentCurrency) => void
  /** Stretch trigger across the parent (wallet deposit / forms). */
  fullWidth?: boolean
  className?: string
}

/** Token chip / full-width trigger — liquid-glass dropdown with mark + network. */
export function PaymentMethodPicker({
  currency,
  disabled,
  onCurrencyChange,
  fullWidth = false,
  className,
}: PaymentMethodPickerProps) {
  const t = useTranslations("upgradePage.crypto")
  const selected =
    PAYMENT_TOKENS.find((option) => option.id === currency) ??
    PAYMENT_TOKENS[0]!

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="ghost"
            className={cn(
              chatMobileGlassSurfaceClass,
              "h-12 gap-2.5 rounded-2xl border-white/55 px-3 pe-3",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-8px_16px_-12px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-10px_rgba(15,23,42,0.14)]",
              "hover:bg-white/28 hover:border-white/70",
              "dark:border-white/20 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.14),inset_0_-10px_20px_-12px_rgba(0,0,0,0.45),0_8px_24px_-10px_rgba(0,0,0,0.42)]",
              "dark:hover:bg-white/16 dark:hover:border-white/28",
              fullWidth ? "w-full justify-start" : "h-11 shrink-0 px-2.5 pe-2.5",
              className
            )}
            aria-label={t("tokenAria", {
              token: selected.id,
              network: PAYMENT_NETWORK.name,
            })}
          />
        }
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-2xl")} />
        <PaymentMethodMark
          currency={selected.id}
          size="md"
          className="relative z-10"
        />
        <span className="relative z-10 min-w-0 flex-1 text-start">
          <span className="block text-sm leading-none font-semibold tracking-tight">
            {selected.id}
          </span>
          <span className="mt-1 block text-[10px] leading-none text-muted-foreground dark:text-foreground/65">
            {PAYMENT_NETWORK.name}
          </span>
        </span>
        <ChevronDownIcon className="relative z-10 size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={fullWidth ? "start" : "end"}
        sideOffset={8}
        // Above Sheet content (z-51) / overlay (z-50).
        positionerClassName="z-70"
        className={cn(
          fullWidth && "w-(--anchor-width) min-w-(--anchor-width) max-w-none"
        )}
      >
        <DropdownMenuGroup>
          {PAYMENT_TOKENS.map((option) => {
            const active = option.id === currency
            return (
              <DropdownMenuItem
                key={option.id}
                className="justify-between gap-3"
                onClick={() => onCurrencyChange(option.id)}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <PaymentMethodMark currency={option.id} size="md" />
                  <span className="min-w-0 text-start">
                    <span className="block truncate text-sm leading-tight font-semibold">
                      {option.id}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
                      {PAYMENT_NETWORK.name}
                    </span>
                  </span>
                </span>
                {active ? (
                  <SelectionCheckBadge />
                ) : (
                  <SelectionCheckSpacer className="rounded-full ring-1 ring-foreground/12 dark:ring-white/15" />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
