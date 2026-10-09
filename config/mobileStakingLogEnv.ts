/** DEV LAN mobile staking log gate — off unless explicitly enabled. */
export function isMobileStakingLanLogEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false
  const raw = (
    process.env.NEXT_PUBLIC_MOBILE_STAKING_LOGS ??
    process.env.VITE_MOBILE_STAKING_LOGS ??
    ""
  )
    .trim()
    .toLowerCase()
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
}
