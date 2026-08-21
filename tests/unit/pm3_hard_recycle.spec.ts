import { test } from '@japa/runner'
import { PM3, PM3NoSuchProcess } from '#services/pm3'

async function waitForPid(pm3: PM3, name: string, timeoutMs = 2000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const proc = pm3.get(name)
    if (proc && proc.exitCode === null && typeof proc.pid === 'number') {
      return proc.pid
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error(`Process ${name} did not start within ${timeoutMs}ms`)
}

test.group('PM3 hard recycle', (group) => {
  const live: PM3[] = []

  group.each.teardown(async () => {
    while (live.length) {
      const pm3 = live.pop()!
      try {
        await pm3.kill()
      } catch {
        // noop
      }
    }
  })

  test('stop can kill a running child and clears get()', async ({ assert }) => {
    const pm3 = new PM3()
    live.push(pm3)
    await pm3.add('t-stop', { file: 'sleep', arguments: ['30'], restart: false }, true)
    const pid = await waitForPid(pm3, 't-stop')
    assert.isNumber(pid)
    await pm3.stop('t-stop')
    assert.isUndefined(pm3.get('t-stop'))
  }).timeout(5000)

  test('restart recovers after a successful stop', async ({ assert }) => {
    const pm3 = new PM3()
    live.push(pm3)
    await pm3.add('t-restart', { file: 'sleep', arguments: ['30'], restart: false }, true)
    const first = await waitForPid(pm3, 't-restart')
    await pm3.restart('t-restart')
    const second = await waitForPid(pm3, 't-restart')
    assert.isNumber(second)
    assert.notEqual(second, first)
  }).timeout(8000)

  test('hardRecycle re-registers and starts a fresh child', async ({ assert }) => {
    const pm3 = new PM3()
    live.push(pm3)
    await pm3.add('t-recycle', { file: 'sleep', arguments: ['30'], restart: false }, true)
    const first = await waitForPid(pm3, 't-recycle')
    await pm3.hardRecycle(
      't-recycle',
      { file: 'sleep', arguments: ['30'], restart: false },
      true
    )
    const second = await waitForPid(pm3, 't-recycle')
    assert.isNumber(second)
    assert.notEqual(second, first)
  }).timeout(8000)

  test('stop on unknown name still throws PM3NoSuchProcess', async ({ assert }) => {
    const pm3 = new PM3()
    live.push(pm3)
    try {
      await pm3.stop('nope')
      assert.fail('expected PM3NoSuchProcess')
    } catch (error) {
      assert.instanceOf(error, PM3NoSuchProcess)
    }
  })
})
