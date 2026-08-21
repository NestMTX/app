/**
 * Pure recycle decisions for Nest stream workers.
 *
 * The first hard-recycle pass only fired on SDM extend failure or stalled
 * dataRx on a *ready* path. After recycle NULLs the stream token, the extend
 * job sees zero cameras and returns; connecting.jpg keeps dataRx rising; a
 * not-ready path is ignored; demand sits on the live PID. This module is the
 * second pass: keep recycling until a real Nest session exists.
 */

export const NULL_TOKEN_GRACE_MS = 120_000

export type RecycleDecision =
  | { recycle: false; reason?: string }
  | { recycle: true; reason: string }

export interface StallRecycleInput {
  pathReady: boolean
  dataRx: number
  lastDataRx: number | undefined
  stallCount: number
  stallEscalateAfter: number
}

export interface StallRecycleResult {
  nextStallCount: number
  recycle: boolean
  reason?: string
}

export interface UnhealthyWorkerInput {
  enabled: boolean
  hasStreamToken: boolean
  workerAlive: boolean
  publishingPlaceholder: boolean
  unhealthySinceMs: number | null
  cooldownActive: boolean
  graceMs?: number
}

export function decideStallRecycle(input: StallRecycleInput): StallRecycleResult {
  const observed = typeof input.lastDataRx === 'number'
  const noProgress = observed && input.lastDataRx! >= input.dataRx
  const stalled = observed && (!input.pathReady || noProgress)
  if (!stalled) {
    return { nextStallCount: 0, recycle: false }
  }
  const nextStallCount = input.stallCount + 1
  if (nextStallCount >= input.stallEscalateAfter) {
    return {
      nextStallCount,
      recycle: true,
      reason: input.pathReady ? `stalled dataRx x${nextStallCount}` : `path not ready x${nextStallCount}`,
    }
  }
  return { nextStallCount, recycle: false }
}

export function decideUnhealthyWorkerRecycle(input: UnhealthyWorkerInput): RecycleDecision {
  if (!input.enabled) {
    return { recycle: false }
  }
  if (input.cooldownActive) {
    return { recycle: false, reason: 'cooldown' }
  }
  if (!input.workerAlive) {
    return { recycle: false }
  }

  const unhealthy = !input.hasStreamToken || input.publishingPlaceholder
  if (!unhealthy) {
    return { recycle: false }
  }

  const grace = input.graceMs ?? NULL_TOKEN_GRACE_MS
  if (input.unhealthySinceMs === null || input.unhealthySinceMs < grace) {
    return { recycle: false, reason: 'unhealthy grace' }
  }

  if (!input.hasStreamToken) {
    return { recycle: true, reason: 'null stream token with live worker' }
  }
  return { recycle: true, reason: 'placeholder video with live worker' }
}
