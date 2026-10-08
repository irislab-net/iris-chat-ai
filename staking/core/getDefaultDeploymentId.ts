import type { DeploymentId } from "@/staking/core/types"
import { LEGACY_PRIMARY_DEPLOYMENT_ID } from "@/staking/core/types"

/** Single production deployment until multi-deployment wiring exists. */
export function getDefaultDeploymentId(): DeploymentId {
  return LEGACY_PRIMARY_DEPLOYMENT_ID
}
