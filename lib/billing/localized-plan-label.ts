import type { UserTier } from "@/lib/api/types"

import { displayPlanName } from "@/lib/billing/catalog"

type WorkspacePlanKey = "planFree" | "planPlus" | "planUltimate"

export function localizedPlanLabel(
  tier: UserTier | string | null | undefined,
  label: (key: WorkspacePlanKey) => string
): string {
  const plan = displayPlanName(tier)
  if (plan === "Plus") return label("planPlus")
  if (plan === "Ultimate") return label("planUltimate")
  return label("planFree")
}
