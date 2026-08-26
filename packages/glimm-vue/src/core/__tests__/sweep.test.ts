import { describe, expect, it, vi } from 'vitest'
import type { ShaderController } from '../types'
import { playSweep } from '../sweep'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function makeCtrl(initialProgress: number) {
  const calls = { progress: [] as number[], alpha: [] as number[] }
  const ctrl = {
    canvas: {} as HTMLCanvasElement,
    setProgress: vi.fn((p: number) => {
      calls.progress.push(p)
    }),
    setAlpha: vi.fn((a: number) => {
      calls.alpha.push(a)
    }),
    setPalette: vi.fn(),
    setBandTight: vi.fn(),
    setDirection: vi.fn(),
    setWaveAmount: vi.fn(),
    setRippleAmount: vi.fn(),
    setWaveSpeed: vi.fn(),
    setBrightness: vi.fn(),
    setSwellAmount: vi.fn(),
    getProgress: vi.fn((): number => initialProgress),
    getAlpha: vi.fn((): number => 0),
    destroy: vi.fn()
  }
  return { ctrl: ctrl as unknown as ShaderController, calls }
}

describe('playSweep', () => {
  it('fires onMidpoint exactly once when progress crosses the midpoint', async () => {
    const { ctrl } = makeCtrl(0)
    const onMidpoint = vi.fn()
    const handle = playSweep(ctrl, { sweepMs: 80, outroMs: 1, onMidpoint })
    await handle.done
    expect(onMidpoint).toHaveBeenCalledTimes(1)
  })

  it('resolves the midpoint and done promises', async () => {
    const { ctrl } = makeCtrl(0)
    const handle = playSweep(ctrl, { sweepMs: 80, outroMs: 1 })
    await expect(handle.midpoint).resolves.toBeUndefined()
    await expect(handle.done).resolves.toBeUndefined()
  })

  it('ramps alpha to 0 and fires onComplete after the outro', async () => {
    const { ctrl, calls } = makeCtrl(0)
    const onComplete = vi.fn(() => {
      expect(calls.alpha[calls.alpha.length - 1]).toBe(0)
    })
    const handle = playSweep(ctrl, { sweepMs: 80, outroMs: 1, onComplete })
    await handle.done
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(calls.alpha[calls.alpha.length - 1]).toBe(0)
    expect(calls.progress[calls.progress.length - 1]).toBe(0)
  })

  it('cancel() resolves both promises and stops all setters, leaving progress/alpha untouched', async () => {
    const { ctrl, calls } = makeCtrl(0)
    const handle = playSweep(ctrl, { sweepMs: 1000, outroMs: 500 })
    handle.cancel()
    await expect(handle.midpoint).resolves.toBeUndefined()
    await expect(handle.done).resolves.toBeUndefined()
    const progressCalls = calls.progress.length
    const alphaCalls = calls.alpha.length
    expect(alphaCalls).toBe(1)
    expect(calls.alpha[0]).toBe(1)
    expect(calls.progress[0]).toBe(0)
    await wait(150)
    expect(calls.progress.length).toBe(progressCalls)
    expect(calls.alpha.length).toBe(alphaCalls)
  })

  it('continues from current progress instead of restarting', async () => {
    const { ctrl, calls } = makeCtrl(0.5)
    const handle = playSweep(ctrl, { sweepMs: 80, outroMs: 1 })
    await handle.done
    expect(calls.progress[0]).toBe(0.5)
    const minDuringSweep = Math.min(...calls.progress.slice(0, -1))
    expect(minDuringSweep).toBeGreaterThanOrEqual(0.5 - 1e-9)
    expect(calls.progress[calls.progress.length - 1]).toBe(0)
  })

  it('restarts from 0 when progress is already complete', async () => {
    const { ctrl, calls } = makeCtrl(1)
    const handle = playSweep(ctrl, { sweepMs: 80, outroMs: 1 })
    await handle.done
    expect(calls.progress[0]).toBe(0)
  })
})
