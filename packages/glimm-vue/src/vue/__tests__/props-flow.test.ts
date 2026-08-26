import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { GlimmProvider } from '../GlimmProvider'
import { useGlimm } from '../useGlimm'
import { PALETTES } from '../../core/palettes'
import type { SweepFn } from '../context'

vi.mock('../../core/shader', () => ({ createShader: vi.fn() }))

import { createShader } from '../../core/shader'

const makeCtrl = () => ({
  canvas: document.createElement('canvas'),
  setProgress: vi.fn(),
  setAlpha: vi.fn(),
  setPalette: vi.fn(),
  setBandTight: vi.fn(),
  setDirection: vi.fn(),
  setWaveAmount: vi.fn(),
  setRippleAmount: vi.fn(),
  setWaveSpeed: vi.fn(),
  setBrightness: vi.fn(),
  setSwellAmount: vi.fn(),
  getProgress: vi.fn(() => 0),
  getAlpha: vi.fn(() => 0),
  destroy: vi.fn()
})

let capturedSweep: SweepFn | null = null
const Probe = defineComponent({
  name: 'Probe',
  setup() {
    const { sweep } = useGlimm()
    capturedSweep = sweep
    return () => h('button', { onClick: () => sweep(() => {}) }, 'go')
  }
})

const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms))

describe('GlimmProvider props flow end-to-end', () => {
  it('applies every visual prop to the controller via real playSweep', async () => {
    const ctrl = makeCtrl()
    vi.mocked(createShader).mockReturnValue(ctrl as any)

    const wrapper = mount(GlimmProvider as any, {
      props: {
        palette: 'berry',
        bandTight: 42,
        direction: 'rtl',
        waveAmount: 1.5,
        rippleAmount: 0.5,
        waveSpeed: 2,
        brightness: 0.8,
        swellAmount: 0.2,
        sweepMs: 80,
        outroMs: 30,
        easing: 'snap',
        midpoint: 0.3,
        peakAlpha: 0.9
      },
      slots: { default: () => h(Probe) }
    })

    await wrapper.find('button').trigger('click')
    await settle()

    expect(createShader).toHaveBeenCalledTimes(1)
    expect(ctrl.setPalette).toHaveBeenCalledWith(PALETTES.berry)
    expect(ctrl.setBandTight).toHaveBeenCalledWith(42)
    expect(ctrl.setDirection).toHaveBeenCalledWith('rtl')
    expect(ctrl.setWaveAmount).toHaveBeenCalledWith(1.5)
    expect(ctrl.setRippleAmount).toHaveBeenCalledWith(0.5)
    expect(ctrl.setWaveSpeed).toHaveBeenCalledWith(2)
    expect(ctrl.setBrightness).toHaveBeenCalledWith(0.8)
    expect(ctrl.setSwellAmount).toHaveBeenCalledWith(0.2)
    expect(ctrl.setAlpha).toHaveBeenCalledWith(0.9)
    expect(ctrl.setProgress).toHaveBeenCalledWith(0)
    wrapper.unmount()
  })

  it('timeline props are honored: custom midpoint fires mid-sweep', async () => {
    const ctrl = makeCtrl()
    vi.mocked(createShader).mockReturnValue(ctrl as any)

    let midpointAt: number | null = null
    const wrapper = mount(GlimmProvider as any, {
      props: { sweepMs: 300, outroMs: 30, midpoint: 0.3 },
      slots: { default: () => h(Probe) }
    })

    const handle = capturedSweep!(() => {}, { onMidpoint: () => { midpointAt = ctrl.setProgress.mock.calls.length } })
    await handle.midpoint
    await handle.done
    expect(midpointAt).not.toBeNull()
    const maxProgress = Math.max(...ctrl.setProgress.mock.calls.map((c) => c[0] as number))
    expect(maxProgress).toBeCloseTo(1, 1)
    wrapper.unmount()
  })

  it('per-call options override provider defaults', async () => {
    const ctrl = makeCtrl()
    vi.mocked(createShader).mockReturnValue(ctrl as any)

    mount(GlimmProvider as any, {
      props: { palette: 'prism', direction: 'ltr' },
      slots: { default: () => h(Probe) }
    })

    const handle = capturedSweep!(() => {}, { palette: { a: [0.1, 0.2, 0.3], b: [0, 0, 0], c: [1, 1, 1], d: [0.5, 0.5, 0.5] }, direction: 'ttb' })
    await handle.done

    expect(ctrl.setPalette).toHaveBeenCalledWith({ a: [0.1, 0.2, 0.3], b: [0, 0, 0], c: [1, 1, 1], d: [0.5, 0.5, 0.5] })
    expect(ctrl.setDirection).toHaveBeenCalledWith('ttb')
  })
})
