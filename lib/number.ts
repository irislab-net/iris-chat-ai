export const getFixedNumber = (value: number, fixed: number = 1) => {
  return Number(value.toFixed(fixed))
}

export function getLargeNumber(value: number): {
  value: number
  suffix?: string
} {
  if (value >= 1_000_000_000)
    return { value: getFixedNumber(value / 1_000_000_000), suffix: "B" }

  if (value >= 1_000_000)
    return { value: getFixedNumber(value / 1_000_000), suffix: "M" }

  if (value >= 1_000)
    return { value: getFixedNumber(value / 1_000), suffix: "K" }

  return { value: getFixedNumber(value) }
}
