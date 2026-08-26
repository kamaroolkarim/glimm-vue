import type { Easing } from './types'

export type { Easing }

/**
 * CSS-style `cubic-bezier(x1, y1, x2, y2)` easing. Returns an Easing that
 * accepts progress 0..1 and returns the eased value. Allows y < 0 and
 * y > 1, so curves can dip below zero or overshoot past one.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  const bezX = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
  const bezY = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
  const bezXd = (t: number) => 3 * (1 - 4 * t + 3 * t * t) * x1 + 3 * (2 * t - 3 * t * t) * x2 + 3 * t * t
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const dx = bezX(t) - x
      if (Math.abs(dx) < 1e-6) break
      const d = bezXd(t)
      if (Math.abs(d) < 1e-6) break
      t -= dx / d
    }
    return bezY(t)
  }
}

export const EASINGS = {
  linear: (p: number) => p,
  easeOutQuart: (p: number) => 1 - Math.pow(1 - p, 4),
  easeOutCubic: (p: number) => 1 - Math.pow(1 - p, 3),
  easeInCubic: (p: number) => p * p * p,
  easeInOutCubic: (p: number) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  easeOutExpo: (p: number) => p === 1 ? 1 : 1 - Math.pow(2, -10 * p),
  easeInOutQuint: (p: number) => p < 0.5 ? 16 * p * p * p * p * p : 1 - Math.pow(-2 * p + 2, 5) / 2,
  // cubic-bezier(1, 0, 0.35, 0.95) — holds at the start, then whips forward.
  snap: cubicBezier(1, 0, 0.35, 0.95),
  // cubic-bezier(0.25, 0.1, 0.25, 1) — CSS default `ease`. Smooth start, gentle finish.
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  // cubic-bezier(0.175, 0.885, 0.32, 1.1) — fast accel, overshoots past 1, settles.
  back: cubicBezier(0.175, 0.885, 0.32, 1.1)
}

export type EasingName = keyof typeof EASINGS

export const resolveEasing = (e: EasingName | Easing | undefined): Easing => {
  if (!e) return EASINGS.easeOutQuart
  if (typeof e === 'function') return e
  return EASINGS[e]
}
