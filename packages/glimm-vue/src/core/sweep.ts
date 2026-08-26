import { resolveEasing } from './easings'
import { resolvePalette } from './palettes'
import type { Easing, ShaderController, SweepHandle, SweepOptions } from './types'

const easeOutQuart = (p: number) => 1 - Math.pow(1 - p, 4)
const easeInOutCubic = (p: number) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2

/**
 * Plays one full sweep on a given shader controller.
 *
 * Continues from the controller's current progress/alpha — so when called
 * while a previous sweep is still in flight (after that one has been
 * `cancel`led), the band keeps moving forward instead of snapping back
 * to the start. The midpoint callback then fires as soon as the (in-progress)
 * band crosses the configured midpoint — which for an interrupted sweep is
 * typically immediate, so the page swap feels snappy.
 */
export function playSweep(ctrl: ShaderController, opts: SweepOptions = {}): SweepHandle {
  const sweepMs = opts.sweepMs ?? 1100
  const outroMs = opts.outroMs ?? 700
  const midpoint = Math.max(0, Math.min(1, opts.midpoint ?? 0.56))
  const easing = resolveEasing(opts.easing ?? 'ease') ?? easeOutQuart
  const peakAlpha = Math.max(0, Math.min(1.5, opts.peakAlpha ?? 1))
  if (opts.palette) ctrl.setPalette(resolvePalette(opts.palette))
  if (opts.bandTight !== undefined) ctrl.setBandTight(opts.bandTight)
  if (opts.direction) ctrl.setDirection(opts.direction)
  if (opts.waveAmount !== undefined) ctrl.setWaveAmount(opts.waveAmount)
  if (opts.rippleAmount !== undefined) ctrl.setRippleAmount(opts.rippleAmount)
  if (opts.waveSpeed !== undefined) ctrl.setWaveSpeed(opts.waveSpeed)
  if (opts.brightness !== undefined) ctrl.setBrightness(opts.brightness)
  if (opts.swellAmount !== undefined) ctrl.setSwellAmount(opts.swellAmount)
  let cancelled = false
  let raf = 0
  let resolveMidpoint!: () => void
  let resolveDone!: () => void
  const midpointP = new Promise<void>((r) => {
    resolveMidpoint = r
  })
  const doneP = new Promise<void>((r) => {
    resolveDone = r
  })
  ;(async () => {
    const currentProgress = ctrl.getProgress()
    const startProgress = currentProgress >= 0.999 ? 0 : Math.max(0, Math.min(1, currentProgress))
    ctrl.setAlpha(peakAlpha)
    ctrl.setProgress(startProgress)
    const remaining = 1 - startProgress
    const phaseMs = Math.max(80, sweepMs * remaining)
    let midpointFired = false
    let midpointTask: Promise<void> = Promise.resolve()
    const fireMidpoint = () => {
      midpointFired = true
      midpointTask = Promise.resolve().then(() => opts.onMidpoint?.()).then(() => {
      })
      midpointTask.then(resolveMidpoint, (error) => {
        console.error('[glimm] midpoint callback failed:', error)
        resolveMidpoint()
      })
    }
    const t0 = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (cancelled) {
          resolve()
          return
        }
        const raw = Math.min(1, (performance.now() - t0) / phaseMs)
        const eased = easing(raw)
        const progress = startProgress + remaining * eased
        ctrl.setProgress(progress)
        if (!midpointFired && progress >= midpoint) {
          fireMidpoint()
        }
        if (raw < 1) raf = requestAnimationFrame(tick)
        else resolve()
      }
      raf = requestAnimationFrame(tick)
    })
    if (cancelled) return
    if (!midpointFired) {
      fireMidpoint()
    }
    await midpointTask.catch(() => {
    })
    if (cancelled) return
    await runRamp(outroMs, peakAlpha, 0, easeInOutCubic, ctrl.setAlpha, () => cancelled, (id) => {
      raf = id
    })
    if (cancelled) return
    ctrl.setProgress(0)
    opts.onComplete?.()
    resolveDone()
  })()
  return {
    midpoint: midpointP,
    done: doneP,
    cancel: () => {
      cancelled = true
      cancelAnimationFrame(raf)
      resolveMidpoint()
      resolveDone()
    }
  }
}

function runRamp(durationMs: number, from: number, to: number, ease: Easing, setter: (v: number) => void, isCancelled: () => boolean, setRaf: (id: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now()
    const tick = () => {
      if (isCancelled()) {
        resolve()
        return
      }
      const raw = Math.min(1, (performance.now() - t0) / durationMs)
      setter(from + (to - from) * ease(raw))
      if (raw < 1) setRaf(requestAnimationFrame(tick))
      else resolve()
    }
    setRaf(requestAnimationFrame(tick))
  })
}
