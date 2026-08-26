import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createShader } from '../../core/shader'
import { playSweep } from '../../core/sweep'
import { GlimmProvider } from '../GlimmProvider'
import { useGlimm } from '../useGlimm'
import type { Ctx, GlimmDefaults } from '../context'
import type { ShaderController, SweepHandle, SweepOptions } from '../../core/types'

vi.mock('../../core/shader', () => ({ createShader: vi.fn() }))
vi.mock('../../core/sweep', () => ({ playSweep: vi.fn() }))

function makeFakeCtrl() {
  const destroy = vi.fn()
  const ctrl = {
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
    getProgress: vi.fn((): number => 0),
    getAlpha: vi.fn((): number => 0),
    destroy
  }
  return { ctrl: ctrl as unknown as ShaderController, destroy }
}

const pendingForever = () => new Promise<void>(() => {})

function makeHandle(done: Promise<void> = pendingForever()) {
  const cancel = vi.fn()
  const handle = { midpoint: Promise.resolve(), done, cancel }
  return { handle: handle as SweepHandle, cancel }
}

let ctx: Ctx | undefined
const Consumer = defineComponent({
  name: 'Consumer',
  setup() {
    ctx = useGlimm()
    return () => h('div', { class: 'consumer' }, 'consumer')
  }
})

function mountProvider(props: GlimmDefaults = {}) {
  const Host = defineComponent({
    name: 'Host',
    setup() {
      return () => h('div', { id: 'app-root' }, h(GlimmProvider, props, { default: () => h(Consumer) }))
    }
  })
  return mount(Host)
}

let originalMatchMedia: typeof window.matchMedia | undefined
function stubPrefersReducedMotion(matches: boolean) {
  if (originalMatchMedia === undefined) originalMatchMedia = window.matchMedia
  window.matchMedia = (() => ({ matches })) as unknown as typeof window.matchMedia
}

describe('GlimmProvider', () => {
  beforeEach(() => {
    ctx = undefined
    vi.resetAllMocks()
    stubPrefersReducedMotion(false)
    vi.mocked(createShader).mockImplementation(() => makeFakeCtrl().ctrl)
    vi.mocked(playSweep).mockImplementation(() => makeHandle().handle)
  })

  afterEach(() => {
    if (originalMatchMedia !== undefined) {
      window.matchMedia = originalMatchMedia
      originalMatchMedia = undefined
    }
  })

  it('throws the exact message when useGlimm is used outside <GlimmProvider>', () => {
    expect(() => useGlimm()).toThrowError('useGlimm must be used inside <GlimmProvider>')
  })

  it('does not create the canvas on mount alone (lazy controller)', () => {
    const wrapper = mountProvider()
    expect(createShader).not.toHaveBeenCalled()
    expect(playSweep).not.toHaveBeenCalled()
    expect(wrapper.find('canvas').exists()).toBe(false)
    const root = wrapper.element as HTMLElement
    const children = Array.from(root.children)
    expect(children[0]!.classList.contains('consumer')).toBe(true)
    expect(children[1]!.getAttribute('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('creates the controller on first sweep and appends the canvas to the host div', () => {
    const wrapper = mountProvider({ bandTight: 2.5, direction: 'rtl' })
    ctx!.sweep(vi.fn())
    expect(createShader).toHaveBeenCalledTimes(1)
    const host = wrapper.find('div[aria-hidden="true"]').element as HTMLDivElement
    const canvas = host.querySelector('canvas')
    expect(canvas).not.toBeNull()
    const opts = vi.mocked(createShader).mock.calls[0]![0]!
    expect(opts.canvas).toBe(canvas)
    expect(opts.bandTight).toBe(2.5)
    expect(opts.direction).toBe('rtl')
    expect(opts.palette).toEqual(
      expect.objectContaining({
        a: expect.any(Array),
        b: expect.any(Array),
        c: expect.any(Array),
        d: expect.any(Array)
      })
    )
    expect(canvas!.getAttribute('aria-hidden')).toBe('true')
    expect(canvas!.style.position).toBe('absolute')
    expect(canvas!.style.pointerEvents).toBe('none')
    ctx!.sweep(vi.fn())
    expect(createShader).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('renders the host div fixed with the default zIndex 9999', () => {
    const wrapper = mountProvider()
    ctx!.sweep(vi.fn())
    const host = wrapper.find('div[aria-hidden="true"]').element as HTMLDivElement
    expect(host.style.position).toBe('fixed')
    expect(host.style.pointerEvents).toBe('none')
    expect(host.style.zIndex).toBe('9999')
    wrapper.unmount()
  })

  it('uses the zIndex prop for the host div', () => {
    const wrapper = mountProvider({ zIndex: 42 })
    ctx!.sweep(vi.fn())
    expect((wrapper.find('div[aria-hidden="true"]').element as HTMLDivElement).style.zIndex).toBe('42')
    wrapper.unmount()
  })

  it('navigates immediately without animation when the user prefers reduced motion', async () => {
    stubPrefersReducedMotion(true)
    const wrapper = mountProvider()
    const navigate = vi.fn()
    const handle = ctx!.sweep(navigate)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(createShader).not.toHaveBeenCalled()
    expect(playSweep).not.toHaveBeenCalled()
    expect(typeof handle.cancel).toBe('function')
    await handle.midpoint
    await handle.done
    wrapper.unmount()
  })

  it('sweeps anyway with reducedMotion: "sweep" even when the user prefers reduced motion', () => {
    stubPrefersReducedMotion(true)
    const wrapper = mountProvider({ reducedMotion: 'sweep' })
    ctx!.sweep(vi.fn())
    expect(createShader).toHaveBeenCalledTimes(1)
    expect(playSweep).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('navigates immediately when the shader factory returns null (no WebGL)', async () => {
    vi.mocked(createShader).mockReturnValue(null)
    const wrapper = mountProvider()
    const navigate = vi.fn()
    const handle = ctx!.sweep(navigate)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(playSweep).not.toHaveBeenCalled()
    expect(
      (wrapper.find('div[aria-hidden="true"]').element as HTMLDivElement).querySelector('canvas')
    ).toBeNull()
    await handle.done
    wrapper.unmount()
  })

  it('fires onController once with the controller and honours shaderFactory', () => {
    const { ctrl, destroy } = makeFakeCtrl()
    const factory = vi.fn(() => ctrl)
    const onController = vi.fn()
    const wrapper = mountProvider({ shaderFactory: factory, onController })
    ctx!.sweep(vi.fn())
    ctx!.sweep(vi.fn())
    expect(factory).toHaveBeenCalledTimes(1)
    expect(createShader).not.toHaveBeenCalled()
    expect(onController).toHaveBeenCalledTimes(1)
    expect(onController).toHaveBeenCalledWith(ctrl)
    expect(destroy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('cancels the in-flight sweep, merges options over defaults and awaits navigate before onMidpoint', async () => {
    const wrapper = mountProvider({ sweepMs: 1200, zIndex: 5 })
    expect(ctx!.defaults.sweepMs).toBe(1200)
    expect(ctx!.defaults.zIndex).toBe(5)
    const first = makeHandle()
    const second = makeHandle()
    vi.mocked(playSweep).mockReturnValueOnce(first.handle).mockReturnValueOnce(second.handle)
    ctx!.sweep(vi.fn())
    expect(first.cancel).not.toHaveBeenCalled()
    const merged = vi.mocked(playSweep).mock.calls[0]![1]! as SweepOptions & GlimmDefaults
    expect(merged.sweepMs).toBe(1200)
    expect(merged.zIndex).toBe(5)
    let releaseNavigate!: () => void
    const navigate = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseNavigate = resolve
        })
    )
    const onMidpoint = vi.fn()
    const onComplete = vi.fn()
    const secondHandle = ctx!.sweep(navigate, { sweepMs: 900, onMidpoint, onComplete })
    expect(first.cancel).toHaveBeenCalledTimes(1)
    expect(second.cancel).not.toHaveBeenCalled()
    expect(secondHandle).toBe(second.handle)
    const mergedOptions = vi.mocked(playSweep).mock.calls[1]![1]! as SweepOptions & GlimmDefaults
    expect(mergedOptions.sweepMs).toBe(900)
    expect(mergedOptions.zIndex).toBe(5)
    const midpointRun = mergedOptions.onMidpoint!()
    await Promise.resolve()
    expect(onMidpoint).not.toHaveBeenCalled()
    releaseNavigate()
    await midpointRun
    expect(onMidpoint).toHaveBeenCalledTimes(1)
    mergedOptions.onComplete!()
    expect(onComplete).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('clears the active handle once done settles', async () => {
    const wrapper = mountProvider()
    const resolved = Promise.resolve()
    const { handle, cancel } = makeHandle(resolved)
    vi.mocked(playSweep).mockReturnValueOnce(handle)
    ctx!.sweep(vi.fn())
    await handle.done
    await new Promise((resolve) => setTimeout(resolve, 0))
    wrapper.unmount()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('cancels the active sweep and destroys the controller on unmount', () => {
    let captured: ShaderController | undefined
    const { ctrl, destroy } = makeFakeCtrl()
    vi.mocked(createShader).mockImplementation(() => ctrl)
    const wrapper = mountProvider({ onController: (c) => (captured = c) })
    const { handle, cancel } = makeHandle()
    vi.mocked(playSweep).mockReturnValueOnce(handle)
    ctx!.sweep(vi.fn())
    wrapper.unmount()
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(captured).toBe(ctrl)
    expect(destroy).toHaveBeenCalledTimes(1)
  })
})
