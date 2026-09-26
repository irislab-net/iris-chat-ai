"use client"

import { CheckIcon, ChevronDownIcon } from "lucide-react"
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
import { PAYMENT_NETWORK, PAYMENT_TOKENS } from "@/lib/billing/payment-options"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import {
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

type PaymentMethodPickerProps = {
  currency: PaymentCurrency
  disabled?: boolean
  onCurrencyChange: (currency: PaymentCurrency) => void
}

/** Compact icon trigger for the amount row — opens a liquid-glass token menu. */
export function PaymentMethodPicker({
  currency,
  disabled,
  onCurrencyChange,
}: PaymentMethodPickerProps) {
  const t = useTranslations("upgradePage.crypto")
  const selected =
    PAYMENT_TOKENS.find((option) => option.id === currency) ?? PAYMENT_TOKENS[0]!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="ghost"
            className={cn(
              landingGlassSurface,
              "h-9 shrink-0 gap-1 rounded-full bg-white/55 px-2 shadow-none hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/14"
            )}
            aria-label={t("tokenAria", {
              token: selected.id,
              network: PAYMENT_NETWORK.name,
            })}
          />
        }
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <PaymentMethodMark
          currency={selected.id}
          size="sm"
          className="relative z-10"
        />
        <ChevronDownIcon className="relative z-10 size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          landingGlassSurface,
          "min-w-52 gap-0 rounded-[1.25rem] bg-white/82 p-1.5 shadow-lg ring-0 backdrop-blur-xl dark:bg-white/12"
        )}
      >
        <span
          aria-hidden
          className={cn(landingGlassSheen, "rounded-[1.25rem]")}
        />
        <DropdownMenuGroup className="relative z-10 flex flex-col gap-1">
          {PAYMENT_TOKENS.map((option) => {
            const active = option.id === currency
            return (
              <DropdownMenuItem
                key={option.id}
                className={cn(
                  "min-h-12 justify-between gap-3 rounded-2xl px-2.5 py-2",
                  "bg-white/35 hover:bg-white/60 dark:bg-white/6 dark:hover:bg-white/12",
                  active && "bg-white/70 ring-1 ring-[#2563EB]/25 dark:bg-white/14"
                )}
                onClick={() => onCurrencyChange(option.id)}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <PaymentMethodMark currency={option.id} size="md" />
                  <span className="min-w-0 text-start">
                    <span className="block truncate text-sm font-semibold leading-tight">
                      {option.id}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
                      {PAYMENT_NETWORK.name}
                    </span>
                  </span>
                </span>
                {active ? (
                  <CheckIcon className="size-4 shrink-0 text-[#2563EB]" />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
