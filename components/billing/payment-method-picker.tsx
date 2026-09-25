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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PAYMENT_NETWORK, PAYMENT_TOKENS } from "@/lib/billing/payment-options"
import type { PaymentCurrency } from "@/lib/billing/invoice-types"
import { cn } from "@/lib/utils"

type PaymentMethodPickerProps = {
  currency: PaymentCurrency
  disabled?: boolean
  onCurrencyChange: (currency: PaymentCurrency) => void
}

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
            variant="outline"
            className="h-14 w-full justify-between gap-3 rounded-2xl bg-background/80 px-3.5 shadow-none"
            aria-label={t("tokenAria", {
              token: selected.id,
              network: PAYMENT_NETWORK.name,
            })}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <PaymentMethodMark currency={selected.id} size="lg" />
          <span className="min-w-0 text-start">
            <span className="block truncate text-[15px] font-semibold leading-tight">
              {selected.id}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {selected.name} · {PAYMENT_NETWORK.name}
            </span>
          </span>
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-(--anchor-width) gap-0 rounded-2xl p-1.5 shadow-lg ring-0"
      >
        <DropdownMenuGroup className="flex flex-col gap-0.5">
          <DropdownMenuLabel className="px-2.5 pb-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">
            {t("networkLabel")} · {PAYMENT_NETWORK.name}
          </DropdownMenuLabel>
          {PAYMENT_TOKENS.map((option) => {
            const active = option.id === currency
            return (
              <DropdownMenuItem
                key={option.id}
                className={cn(
                  "min-h-14 justify-between gap-3 rounded-xl px-2.5 py-2",
                  active && "bg-muted/60"
                )}
                onClick={() => onCurrencyChange(option.id)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <PaymentMethodMark currency={option.id} size="md" />
                  <span className="min-w-0 text-start">
                    <span className="block truncate text-sm font-semibold leading-tight">
                      {option.id}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {option.name}
                    </span>
                  </span>
                </span>
                {active ? (
                  <CheckIcon className="size-4 shrink-0 text-foreground" />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
