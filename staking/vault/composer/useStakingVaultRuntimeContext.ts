import { createTronAddressCodec } from "@/staking/core/address"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import { getJsonRpcProviderForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import { devAssertRuntimeContextStable } from "@/staking/diagnostics/stakingInvariantAssertionsDev"
import { isStakingVaultRuntimeHydrationEnabled } from "@/staking/runtime/capabilities/stakingRuntimeHydration"
import { useMemo } from "react"

export type StakingVaultRuntimeContext = Readonly<{
  stakingRuntime: RuntimeOperationContext
  stakingReadOptions: Readonly<{ runtime: RuntimeOperationContext }>
  isTronPassiveRuntime: boolean
  tronAddressCodec: ReturnType<typeof createTronAddressCodec>
  stakingReadJsonRpc: ReturnType<typeof getJsonRpcProviderForDeployment> | null
}>

export function useStakingVaultRuntimeContext(
  stakingRuntime: RuntimeOperationContext
): StakingVaultRuntimeContext {
  const stakingReadOptions = useMemo(
    () => ({ runtime: stakingRuntime }),
    [stakingRuntime]
  )
  const isTronPassiveRuntime = stakingRuntime.deployment.chainFamily === "tron"
  const tronAddressCodec = useMemo(() => createTronAddressCodec(), [])
  const stakingReadJsonRpc = useMemo(() => {
    if (stakingRuntime.deployment.chainFamily !== "evm") return null
    if (!isStakingVaultRuntimeHydrationEnabled(stakingRuntime.deployment)) return null
    return getJsonRpcProviderForDeployment(stakingRuntime.deployment)
  }, [stakingRuntime])

  devAssertRuntimeContextStable({ stakingRuntime, label: "useStakingVaultRuntimeContext" })

  return {
    stakingRuntime,
    stakingReadOptions,
    isTronPassiveRuntime,
    tronAddressCodec,
    stakingReadJsonRpc,
  }
}
