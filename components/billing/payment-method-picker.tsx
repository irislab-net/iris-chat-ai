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

/** Token chip for the amount row — liquid-glass trigger with mark + label. */
export function PaymentMethodPicker({
  currency,
  disabled,
  onCurrencyChange,
}: PaymentMethodPickerProps) {
  const t = useTranslations("upgradePage.crypto")
  const selected =
    PAYMENT_TOKENS.find((option) => option.id === currency) ??
    PAYMENT_TOKENS[0]!

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
              "h-11 shrink-0 gap-2 rounded-2xl bg-white/70 px-2.5 pe-2.5 shadow-none",
              "hover:bg-white/85 dark:bg-white/12 dark:hover:bg-white/18"
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
        <span className="relative z-10 min-w-0 text-start">
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
        align="end"
        sideOffset={8}
        className={cn(
          landingGlassSurface,
          "min-w-48 gap-0 rounded-[1.25rem] bg-white/82 p-1 shadow-lg ring-0 backdrop-blur-xl dark:bg-white/12"
        )}
      >
        <span
          aria-hidden
          className={cn(landingGlassSheen, "rounded-[1.25rem]")}
        />
        <DropdownMenuGroup className="relative z-10 flex flex-col">
          {PAYMENT_TOKENS.map((option) => {
            const active = option.id === currency
            return (
              <DropdownMenuItem
                key={option.id}
                className={cn(
                  "min-h-11 justify-between gap-3 rounded-xl px-2.5 py-2",
                  "bg-transparent hover:bg-transparent focus:bg-transparent",
                  "dark:hover:bg-transparent dark:focus:bg-transparent",
                  "data-highlighted:bg-transparent data-highlighted:text-foreground",
                  "opacity-70 hover:opacity-100 focus:opacity-100",
                  active && "opacity-100"
                )}
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
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)]"
                    aria-hidden
                  >
                    <CheckIcon className="size-3 stroke-[2.5]" />
                  </span>
                ) : (
                  <span
                    className="size-5 shrink-0 rounded-full ring-1 ring-foreground/12 dark:ring-white/15"
                    aria-hidden
                  />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
