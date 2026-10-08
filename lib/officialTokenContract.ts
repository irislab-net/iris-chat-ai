import { createDeploymentExplorerResolver } from "@/staking/core/createExplorerResolver"
import {
  getStakingDeploymentRegistry,
  resolveStakingDeploymentForReconcile,
} from "@/staking/core/getStakingDeploymentRegistry"
import { LEGACY_PRIMARY_DEPLOYMENT_ID } from "@/staking/core/types"
import { resolveStakingDeploymentForActiveSelection } from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
import type { SmartContractDetails } from "@/types/smartContract"

type PublicContractDetails = SmartContractDetails & {
  badge?: string
  description?: string
}

type PublicContractRuntimeContext = {
  networkLabel: string
  explorerLabel: string
}

function getActiveContractDeployment() {
  const registry = getStakingDeploymentRegistry()
  const legacyPrimary = registry.deployments.find(
    deployment => deployment.id.trim() === LEGACY_PRIMARY_DEPLOYMENT_ID.trim()
  )
  if (legacyPrimary) return legacyPrimary
  if (registry.deployments.length > 0) {
    return resolveStakingDeploymentForReconcile(registry, registry.defaultDeploymentId)
  }
  return resolveStakingDeploymentForActiveSelection(registry)
}

function buildAbiLink(addressLink: string, chainFamily: string): string {
  return chainFamily === "evm" ? `${addressLink}#code` : addressLink
}

export function getOfficialTokenContractDetails(): PublicContractDetails {
  const deployment = getActiveContractDeployment()
  const explorer = createDeploymentExplorerResolver(deployment)
  const link = explorer.addressUrl(deployment.token.address) ?? "#"

  return {
    name: "USDM",
    address: deployment.token.address,
    link,
    abiLink: buildAbiLink(link, deployment.chainFamily),
    badge: "Official token",
    description: `${deployment.labels.network} contract from the active Matrix runtime config.`,
  }
}

export function getPublicContractRuntimeContext(): PublicContractRuntimeContext {
  const deployment = getActiveContractDeployment()

  return {
    networkLabel: deployment.labels.network,
    explorerLabel: deployment.explorer.label,
  }
}

export function getPublicRuntimeContractDetails(): PublicContractDetails[] {
  const deployment = getActiveContractDeployment()
  const explorer = createDeploymentExplorerResolver(deployment)
  const tokenLink = explorer.addressUrl(deployment.token.address) ?? "#"
  const vaultLink = explorer.addressUrl(deployment.vault.address) ?? "#"

  return [
    {
      name: "USDM",
      address: deployment.token.address,
      link: tokenLink,
      abiLink: buildAbiLink(tokenLink, deployment.chainFamily),
      badge: "Official token",
      description: `${deployment.labels.network} contract from the active Matrix runtime config.`,
    },
    {
      name: "Staking Vault",
      address: deployment.vault.address,
      link: vaultLink,
      abiLink: buildAbiLink(vaultLink, deployment.chainFamily),
      badge: deployment.labels.network,
      description: "Active vault contract for the current Matrix staking deployment.",
    },
  ]
}
