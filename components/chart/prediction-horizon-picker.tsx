"use client"

import * as React from "react"

import type { PredictionHorizon } from "@/lib/chart/prediction-contract"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const HORIZONS: PredictionHorizon[] = ["24h", "4h", "1m"]

type PredictionHorizonPickerProps = {
  value: PredictionHorizon
  enabled: readonly PredictionHorizon[]
  onChange: (horizon: PredictionHorizon) => void
  className?: string
}

function PredictionHorizonPicker({
  value,
  enabled,
  onChange,
  className,
}: PredictionHorizonPickerProps) {
  if (enabled.length === 0) return null

  return (
    <div
      className={cn(
        "absolute top-2 left-2 z-20 flex rounded-md border border-border/80 bg-background/90 p-0.5",
        className
      )}
      role="group"
      aria-label="Prediction horizon"
    >
      {HORIZONS.filter((horizon) => enabled.includes(horizon)).map((horizon) => (
        <Button
          key={horizon}
          type="button"
          size="xs"
          variant={value === horizon ? "secondary" : "ghost"}
          className="h-5 px-1.5 font-mono text-[9px] uppercase"
          onClick={() => onChange(horizon)}
        >
          {horizon}
        </Button>
      ))}
    </div>
  )
}

export { PredictionHorizonPicker }
