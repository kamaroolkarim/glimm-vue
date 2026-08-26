import { describe, expect, it } from 'vitest'
import { hexToRgb, oklchToRgb, rgbToOklch, sampleChainRgb } from '../oklch'

describe('oklch', () => {
  it('round-trips rgb → oklch → rgb within 1e-6', () => {
    const colors: [number, number, number][] = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
      [0.5, 0.25, 0.75]
    ]
    for (const rgb of colors) {
      const back = oklchToRgb(rgbToOklch(rgb))
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(back[i] - rgb[i])).toBeLessThan(1e-6)
      }
    }
  })

  it('maps known colors to sane OKLCH values', () => {
    const black = rgbToOklch([0, 0, 0])
    expect(black.L).toBe(0)
    expect(black.C).toBe(0)
    const white = rgbToOklch([1, 1, 1])
    expect(Math.abs(white.L - 1)).toBeLessThan(1e-6)
    expect(white.C).toBeLessThan(1e-6)
  })

  it('parses hex colors', () => {
    expect(hexToRgb('#FF0000')).toEqual([1, 0, 0])
    expect(hexToRgb('#00ff42')).toEqual([0, 1, 66 / 255])
    expect(hexToRgb('123456')).toEqual([0x12 / 255, 0x34 / 255, 0x56 / 255])
  })

  it('returns empty samples for empty anchors', () => {
    expect(sampleChainRgb([], 10)).toEqual([])
  })

  it('returns constant samples for a single anchor', () => {
    const anchor = rgbToOklch(hexToRgb('#FF7A1A'))
    const samples = sampleChainRgb([anchor], 4)
    expect(samples.length).toBe(4)
    const rgb = oklchToRgb(anchor)
    for (const s of samples) expect(s).toEqual(rgb)
  })

  it('hits both anchor colors at the chain endpoints', () => {
    const a = rgbToOklch(hexToRgb('#FF0000'))
    const b = rgbToOklch(hexToRgb('#0000FF'))
    const samples = sampleChainRgb([a, b], 17)
    expect(samples[0]).toEqual(oklchToRgb(a))
    const end = oklchToRgb(b)
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(samples[16][i] - end[i])).toBeLessThan(1e-12)
    }
  })

  it('interpolates hue along the shortest arc across the wrap', () => {
    const nearPi = { L: 0.7, C: 0.15, H: Math.PI - 0.05 }
    const nearMinusPi = { L: 0.7, C: 0.15, H: -Math.PI + 0.05 }
    const samples = sampleChainRgb([nearPi, nearMinusPi], 3)
    const expectedMid = oklchToRgb({ L: 0.7, C: 0.15, H: Math.PI })
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(samples[1][i] - expectedMid[i])).toBeLessThan(1e-9)
    }
  })

  it('interpolates hue monotonically without wrapping for close hues', () => {
    const a = { L: 0.7, C: 0.15, H: 0.1 }
    const b = { L: 0.7, C: 0.15, H: 0.3 }
    const samples = sampleChainRgb([a, b], 3)
    const expectedMid = oklchToRgb({ L: 0.7, C: 0.15, H: 0.2 })
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(samples[1][i] - expectedMid[i])).toBeLessThan(1e-12)
    }
  })
})
