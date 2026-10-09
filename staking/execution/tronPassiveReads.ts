/**
 * Passive Tron FullNode reads for staking (TRC20 + vault view calls).
 * EVM paths stay in `stakingReadFactory`; this module is Tron-only.
 */
import { AbiCoder, MaxUint256, getBytes } from "ethers"
import { getOrCreateTronHttpProviderForDeployment } from "@/staking/core/providerRegistry"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import type { TronHttpProvider } from "@/staking/core/tronProviderTypes"

const READ_TIMEOUT_MS = 12_000

function withTimeout<T>(p: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"))
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(Object.assign(new Error("read-timeout"), { code: "TIMEOUT" }))
    }, ms)
    const onAbort = () => {
      clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    }
    if (signal) signal.addEventListener("abort", onAbort, { once: true })
    p.then(
      v => {
        clearTimeout(t)
        if (signal) signal.removeEventListener("abort", onAbort)
        resolve(v)
      },
      e => {
        clearTimeout(t)
        if (signal) signal.removeEventListener("abort", onAbort)
        reject(e)
      }
    )
  })
}

async function tronPostWallet<T>(
  http: TronHttpProvider,
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<T> {
  return withTimeout(http.postWalletJson<T>(path, body, signal), READ_TIMEOUT_MS, signal)
}

/** 21-byte wire hex from FullNode (`41` + 20 bytes), without leading `0x`. */
async function tronAccountAddressHex21(
  http: TronHttpProvider,
  base58: string,
  signal?: AbortSignal
): Promise<string | null> {
  const t = base58.trim()
  if (!t) return null
  try {
    const acc = await tronPostWallet<Record<string, unknown>>(
      http,
      "/wallet/getaccount",
      { address: t, visible: true },
      signal
    )
    const raw = acc.address
    if (typeof raw !== "string") return null
    const h = raw.trim().replace(/^0x/i, "")
    if (!/^41[0-9a-fA-F]{40}$/.test(h)) return null
    return h.toLowerCase()
  } catch {
    return null
  }
}

/** 64-char hex (no 0x) left-padded word for `address` ABI arg from Tron base58 account. */
export async function tronAbiAddressWordFromBase58(
  http: TronHttpProvider,
  base58: string,
  signal?: AbortSignal
): Promise<string> {
  const h21 = await tronAccountAddressHex21(http, base58, signal)
  if (!h21) return "0".repeat(64)
  const body20 = h21.slice(2)
  return body20.padStart(64, "0")
}

async function triggerConstantFirstWord(
  http: TronHttpProvider,
  params: {
    ownerBase58: string
    contractBase58: string
    functionSelector: string
    parameterHexNo0x: string
  },
  signal?: AbortSignal
): Promise<string | null> {
  const res = await tronPostWallet<Record<string, unknown>>(
    http,
    "/wallet/triggerconstantcontract",
    {
      owner_address: params.ownerBase58.trim(),
      contract_address: params.contractBase58.trim(),
      function_selector: params.functionSelector,
      parameter: params.parameterHexNo0x,
      visible: true,
    },
    signal
  )
  const cr = res.constant_result
  if (!Array.isArray(cr) || typeof cr[0] !== "string") return null
  const word = (cr[0] as string).trim().replace(/^0x/i, "")
  if (!/^[0-9a-fA-F]*$/.test(word)) return null
  return word.length > 0 ? word : null
}

function decodeUint256FromWord(word: string | null): bigint | null {
  if (!word) return null
  const w = word.length >= 64 ? word.slice(-64) : word.padStart(64, "0")
  try {
    return BigInt(`0x${w}`)
  } catch {
    return null
  }
}

function decodeAbiStringFromConstantResult(word: string | null): string {
  if (!word) return ""
  const hex = word.length % 2 === 1 ? `0${word}` : word
  try {
    const buf = getBytes(`0x${hex}`)
    const [s] = AbiCoder.defaultAbiCoder().decode(["string"], buf) as unknown as [string]
    return typeof s === "string" ? s : ""
  } catch {
    try {
      const w = hex.padStart(64, "0").slice(-64)
      const buf = getBytes(`0x${w}`)
      const [b32] = AbiCoder.defaultAbiCoder().decode(["bytes32"], buf) as unknown as [string]
      return String(b32)
        .replace(/\0/g, "")
        .trim()
    } catch {
      return ""
    }
  }
}

export type TronPassiveReadBalances = {
  walletBalance: bigint
  allowance: bigint
  vaultShares: bigint
  stakedAssets: bigint
  vaultMaxDepositWei: bigint
  vaultMaxWithdrawWei: bigint
  minWithdrawalFeeWei: bigint
}

/**
 * TRC20 + vault numeric reads for passive Tron staking row.
 * Uses `wallet/triggerconstantcontract` on the deployment’s FullNode HTTP URL.
 */
export async function fetchTronPassiveReadBalances(input: {
  deployment: StakingDeploymentConfig
  tokenContractBase58: string
  walletBase58: string
  signal?: AbortSignal
}): Promise<TronPassiveReadBalances> {
  const { deployment, tokenContractBase58, walletBase58, signal } = input
  const http = getOrCreateTronHttpProviderForDeployment(deployment)
  const vault = deployment.vault.address.trim()
  const token = tokenContractBase58.trim()
  const owner = walletBase58.trim()

  const ownerWord = await tronAbiAddressWordFromBase58(http, owner, signal)
  const vaultWord = await tronAbiAddressWordFromBase58(http, vault, signal)

  const [wbW, alW, vsW, mdW, mwW, feeW] = await Promise.all([
    triggerConstantFirstWord(
      http,
      {
        ownerBase58: owner,
        contractBase58: token,
        functionSelector: "balanceOf(address)",
        parameterHexNo0x: ownerWord,
      },
      signal
    ),
    triggerConstantFirstWord(
      http,
      {
        ownerBase58: owner,
        contractBase58: token,
        functionSelector: "allowance(address,address)",
        parameterHexNo0x: `${ownerWord}${vaultWord}`,
      },
      signal
    ),
    triggerConstantFirstWord(
      http,
      {
        ownerBase58: owner,
        contractBase58: vault,
        functionSelector: "balanceOf(address)",
        parameterHexNo0x: ownerWord,
      },
      signal
    ),
    triggerConstantFirstWord(
      http,
      {
        ownerBase58: owner,
        contractBase58: vault,
        functionSelector: "maxDeposit(address)",
        parameterHexNo0x: ownerWord,
      },
      signal
    ),
    triggerConstantFirstWord(
      http,
      {
        ownerBase58: owner,
        contractBase58: vault,
        functionSelector: "maxWithdraw(address)",
        parameterHexNo0x: ownerWord,
      },
      signal
    ),
    triggerConstantFirstWord(
      http,
      {
        ownerBase58: owner,
        contractBase58: vault,
        functionSelector: "minWithdrawalFee()",
        parameterHexNo0x: "",
      },
      signal
    ),
  ])

  const walletBalance = decodeUint256FromWord(wbW) ?? 0n
  const allowance = decodeUint256FromWord(alW) ?? 0n
  const vaultShares = decodeUint256FromWord(vsW) ?? 0n
  const md = decodeUint256FromWord(mdW)
  const mw = decodeUint256FromWord(mwW)
  const fee = decodeUint256FromWord(feeW)

  return {
    walletBalance,
    allowance,
    vaultShares,
    stakedAssets: vaultShares,
    vaultMaxDepositWei: md ?? MaxUint256,
    vaultMaxWithdrawWei: mw ?? MaxUint256,
    minWithdrawalFeeWei: fee ?? 0n,
  }
}

export type TronPassiveTokenMeta = {
  decimals: number
  symbol: string
  name: string
}

export async function fetchTronPassiveTokenMeta(input: {
  deployment: StakingDeploymentConfig
  tokenContractBase58: string
  callerBase58: string
  signal?: AbortSignal
}): Promise<TronPassiveTokenMeta> {
  const { deployment, tokenContractBase58, callerBase58, signal } = input
  const http = getOrCreateTronHttpProviderForDeployment(deployment)
  const token = tokenContractBase58.trim()
  const caller = callerBase58.trim()

  const decW = await triggerConstantFirstWord(
    http,
    {
      ownerBase58: caller,
      contractBase58: token,
      functionSelector: "decimals()",
      parameterHexNo0x: "",
    },
    signal
  )
  const decBn = decodeUint256FromWord(decW)
  const n = decBn != null ? Number(decBn) : NaN
  if (!Number.isInteger(n) || n < 0 || n > 255) {
    throw new Error(`[tron] invalid decimals: ${String(decBn)}`)
  }

  const symW = await triggerConstantFirstWord(
    http,
    {
      ownerBase58: caller,
      contractBase58: token,
      functionSelector: "symbol()",
      parameterHexNo0x: "",
    },
    signal
  )
  const nameW = await triggerConstantFirstWord(
    http,
    {
      ownerBase58: caller,
      contractBase58: token,
      functionSelector: "name()",
      parameterHexNo0x: "",
    },
    signal
  )

  return {
    decimals: n,
    symbol: decodeAbiStringFromConstantResult(symW),
    name: decodeAbiStringFromConstantResult(nameW),
  }
}
