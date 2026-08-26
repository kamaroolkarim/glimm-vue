import { describe, expect, it } from 'vitest'
import { EASINGS, cubicBezier, resolveEasing } from '../easings'

describe('easings', () => {
  it('exposes all ten presets', () => {
    expect(Object.keys(EASINGS).sort()).toEqual([
      'back',
      'ease',
      'easeInCubic',
      'easeInOutCubic',
      'easeInOutQuint',
      'easeOutCubic',
      'easeOutExpo',
      'easeOutQuart',
      'linear',
      'snap'
    ])
  })

  it('linear is the identity', () => {
    expect(EASINGS.linear(0.5)).toBe(0.5)
    expect(EASINGS.linear(0)).toBe(0)
    expect(EASINGS.linear(1)).toBe(1)
  })

  it('formula presets evaluate exactly', () => {
    expect(EASINGS.easeOutQuart(1)).toBe(1)
    expect(EASINGS.easeOutQuart(0.5)).toBe(1 - Math.pow(0.5, 4))
    expect(EASINGS.easeOutCubic(0.5)).toBe(1 - Math.pow(0.5, 3))
    expect(EASINGS.easeInCubic(0.5)).toBe(0.125)
    expect(EASINGS.easeInOutCubic(0.5)).toBe(0.5)
    expect(EASINGS.easeInOutQuint(0.5)).toBe(0.5)
  })

  it('easeOutExpo uses the p === 1 branch', () => {
    expect(EASINGS.easeOutExpo(1)).toBe(1)
    expect(EASINGS.easeOutExpo(0.5)).toBe(1 - Math.pow(2, -5))
  })

  it('cubicBezier clamps to 0 below 0 and 1 above 1', () => {
    const bez = cubicBezier(0.25, 0.1, 0.25, 1)
    expect(bez(0)).toBe(0)
    expect(bez(1)).toBe(1)
    expect(bez(-0.5)).toBe(0)
    expect(bez(1.5)).toBe(1)
  })

  it('cubicBezier solves the curve inside (0, 1)', () => {
    const bez = cubicBezier(0.25, 0.1, 0.25, 1)
    expect(bez(0.25)).toBeCloseTo(0.4085105930156005, 12)
    expect(bez(0.5) > 0.5).toBe(true)
    expect(bez(0.5) < 1).toBe(true)
  })

  it('back overshoots past 1', () => {
    let max = 0
    for (let x = 0; x <= 1; x += 0.01) {
      max = Math.max(max, EASINGS.back(x))
    }
    expect(max).toBeGreaterThan(1)
  })

  it('snap and ease stay within [0, 1] and hit their endpoints', () => {
    for (const name of ['snap', 'ease'] as const) {
      const fn = EASINGS[name]
      expect(fn(0)).toBe(0)
      expect(fn(1)).toBe(1)
      for (let x = 0; x <= 1; x += 0.05) {
        expect(fn(x)).toBeGreaterThanOrEqual(0)
        expect(fn(x)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('resolveEasing defaults when falsy', () => {
    expect(resolveEasing(undefined)).toBe(EASINGS.easeOutQuart)
  })

  it('resolveEasing looks up presets by name', () => {
    expect(resolveEasing('ease')).toBe(EASINGS.ease)
    expect(resolveEasing('snap')).toBe(EASINGS.snap)
    expect(resolveEasing('linear')).toBe(EASINGS.linear)
  })

  it('resolveEasing passes functions through', () => {
    const fn = (p: number) => p * 2
    expect(resolveEasing(fn)).toBe(fn)
  })
})
