import { test } from '@japa/runner'
import {
  NULL_TOKEN_GRACE_MS,
  decideStallRecycle,
  decideUnhealthyWorkerRecycle,
} from '#utilities/stream_recycle_policy'

test.group('stream recycle policy — stall', () => {
  test('does not treat a ready path with rising dataRx as stalled', ({ assert }) => {
    const result = decideStallRecycle({
      pathReady: true,
      dataRx: 5000,
      lastDataRx: 1000,
      stallCount: 0,
      stallEscalateAfter: 2,
    })
    assert.deepEqual(result, { nextStallCount: 0, recycle: false })
  })

  test('escalates a ready path with frozen dataRx after consecutive stalls', ({ assert }) => {
    const first = decideStallRecycle({
      pathReady: true,
      dataRx: 1000,
      lastDataRx: 1000,
      stallCount: 0,
      stallEscalateAfter: 2,
    })
    assert.equal(first.nextStallCount, 1)
    assert.isFalse(first.recycle)

    const second = decideStallRecycle({
      pathReady: true,
      dataRx: 1000,
      lastDataRx: 1000,
      stallCount: first.nextStallCount,
      stallEscalateAfter: 2,
    })
    assert.isTrue(second.recycle)
    assert.equal(second.reason, 'stalled dataRx x2')
  })

  test('counts a not-ready path as stalled even when dataRx is zero', ({ assert }) => {
    const first = decideStallRecycle({
      pathReady: false,
      dataRx: 0,
      lastDataRx: 0,
      stallCount: 0,
      stallEscalateAfter: 2,
    })
    assert.equal(first.nextStallCount, 1)
    assert.isFalse(first.recycle)

    const second = decideStallRecycle({
      pathReady: false,
      dataRx: 0,
      lastDataRx: 0,
      stallCount: first.nextStallCount,
      stallEscalateAfter: 2,
    })
    assert.isTrue(second.recycle)
    assert.equal(second.reason, 'path not ready x2')
  })

  test('does not stall on the first observation of a path', ({ assert }) => {
    const result = decideStallRecycle({
      pathReady: false,
      dataRx: 0,
      lastDataRx: undefined,
      stallCount: 0,
      stallEscalateAfter: 2,
    })
    assert.deepEqual(result, { nextStallCount: 0, recycle: false })
  })
})

test.group('stream recycle policy — unhealthy worker', () => {
  test('does not recycle a healthy live worker with a stream token', ({ assert }) => {
    const result = decideUnhealthyWorkerRecycle({
      enabled: true,
      hasStreamToken: true,
      workerAlive: true,
      publishingPlaceholder: false,
      unhealthySinceMs: 600_000,
      cooldownActive: false,
    })
    assert.deepEqual(result, { recycle: false })
  })

  test('waits through grace after recycle clears the stream token', ({ assert }) => {
    const result = decideUnhealthyWorkerRecycle({
      enabled: true,
      hasStreamToken: false,
      workerAlive: true,
      publishingPlaceholder: false,
      unhealthySinceMs: NULL_TOKEN_GRACE_MS - 1,
      cooldownActive: false,
    })
    assert.deepEqual(result, { recycle: false, reason: 'unhealthy grace' })
  })

  test('recycles when the token is still null after grace and the worker is alive', ({
    assert,
  }) => {
    const result = decideUnhealthyWorkerRecycle({
      enabled: true,
      hasStreamToken: false,
      workerAlive: true,
      publishingPlaceholder: false,
      unhealthySinceMs: NULL_TOKEN_GRACE_MS,
      cooldownActive: false,
    })
    assert.deepEqual(result, {
      recycle: true,
      reason: 'null stream token with live worker',
    })
  })

  test('recycles connecting.jpg even when dataRx is rising and a token is present', ({
    assert,
  }) => {
    const result = decideUnhealthyWorkerRecycle({
      enabled: true,
      hasStreamToken: true,
      workerAlive: true,
      publishingPlaceholder: true,
      unhealthySinceMs: NULL_TOKEN_GRACE_MS,
      cooldownActive: false,
    })
    assert.deepEqual(result, {
      recycle: true,
      reason: 'placeholder video with live worker',
    })
  })

  test('does not recycle during cooldown', ({ assert }) => {
    const result = decideUnhealthyWorkerRecycle({
      enabled: true,
      hasStreamToken: false,
      workerAlive: true,
      publishingPlaceholder: true,
      unhealthySinceMs: NULL_TOKEN_GRACE_MS,
      cooldownActive: true,
    })
    assert.deepEqual(result, { recycle: false, reason: 'cooldown' })
  })

  test('does not recycle a dead worker; demand should start a new one', ({ assert }) => {
    const result = decideUnhealthyWorkerRecycle({
      enabled: true,
      hasStreamToken: false,
      workerAlive: false,
      publishingPlaceholder: false,
      unhealthySinceMs: NULL_TOKEN_GRACE_MS,
      cooldownActive: false,
    })
    assert.deepEqual(result, { recycle: false })
  })

  test('demand stuck on a live PID with a null token recycles after grace', ({ assert }) => {
    const result = decideUnhealthyWorkerRecycle({
      enabled: true,
      hasStreamToken: false,
      workerAlive: true,
      publishingPlaceholder: false,
      unhealthySinceMs: NULL_TOKEN_GRACE_MS,
      cooldownActive: false,
    })
    assert.isTrue(result.recycle)
    assert.equal(result.reason, 'null stream token with live worker')
  })
})
