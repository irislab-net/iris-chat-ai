"use client"

import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { PaymentTokenLogo } from "@/components/billing/payment-token-logo"
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
            className="h-11 w-full justify-between rounded-xl bg-background/80 px-3 shadow-none"
            aria-label={`Payment token: ${selected.id} on ${PAYMENT_NETWORK.name}`}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <PaymentTokenLogo currency={selected.id} />
          <span className="truncate text-sm font-semibold">{selected.id}</span>
          <span className="truncate text-sm text-muted-foreground">
            {PAYMENT_NETWORK.name}
          </span>
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-(--anchor-width) gap-0 rounded-xl p-1.5 shadow-lg ring-0"
      >
        <DropdownMenuGroup className="flex flex-col gap-0.5">
          <DropdownMenuLabel className="px-2 pb-1 text-[10px] tracking-wide uppercase">
            {PAYMENT_NETWORK.name}
          </DropdownMenuLabel>
          {PAYMENT_TOKENS.map((option) => (
            <DropdownMenuItem
              key={option.id}
              className="min-h-10 justify-between gap-2 rounded-lg px-2 py-2"
              onClick={() => onCurrencyChange(option.id)}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <PaymentTokenLogo currency={option.id} size="sm" />
                <span className="text-sm font-semibold">{option.id}</span>
              </span>
              {option.id === currency ? (
                <CheckIcon className="size-3.5 shrink-0 text-foreground" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
