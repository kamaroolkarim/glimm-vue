import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../palettes', () => ({
  resolvePalette: () => ({ a: [0, 0, 0], b: [0, 0, 0], c: [1, 1, 1], d: [0, 0, 0] })
}))

import { createShader } from '../shader'

function makeGL() {
  return {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    BLEND: 8,
    ONE: 9,
    ONE_MINUS_SRC_ALPHA: 10,
    COLOR_BUFFER_BIT: 11,
    TRIANGLE_STRIP: 12,
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => null),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => null),
    useProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn((_p: unknown, n: string) => ({ name: n })),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    viewport: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    drawArrays: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteShader: vi.fn()
  }
}

function makeCanvas(gl: ReturnType<typeof makeGL>) {
  return {
    getContext: (type: string) => (type === 'webgl' ? gl : null),
    getBoundingClientRect: () => ({ width: 100, height: 50 }),
    style: {},
    width: 0,
    height: 0
  } as any
}

let rafCallback: FrameRequestCallback | null = null
const flushFrame = () => {
  rafCallback?.(performance.now())
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallback = cb
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', (_id: number) => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  rafCallback = null
})

describe('createShader', () => {
  it('returns null when WebGL is unavailable', () => {
    expect(createShader()).toBeNull()
  })

  it('compiles, renders, clamps state and destroys', () => {
    const gl = makeGL()
    const canvas = makeCanvas(gl)
    const ctrl = createShader({ canvas })

    expect(ctrl).not.toBeNull()
    expect(ctrl!.canvas).toBe(canvas)
    expect(gl.getUniformLocation).toHaveBeenCalled()
    expect(gl.blendFunc).toHaveBeenCalledWith(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    expect(gl.enable).toHaveBeenCalledWith(gl.BLEND)
    expect(gl.bufferData).toHaveBeenCalledWith(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )
    expect(gl.viewport).toHaveBeenCalledWith(0, 0, 100, 50)

    flushFrame()
    expect(gl.clearColor).toHaveBeenCalledWith(0, 0, 0, 0)
    expect(gl.clear).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT)
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4)
    expect(gl.uniform2f).toHaveBeenCalledWith(
      { name: 'uRes' },
      100,
      50
    )

    ctrl!.setProgress(2)
    expect(ctrl!.getProgress()).toBe(1)
    ctrl!.setAlpha(-1)
    expect(ctrl!.getAlpha()).toBe(0)
    ctrl!.setBandTight(999)

    flushFrame()
    const bandTightValues = gl.uniform1f.mock.calls
      .filter((c) => (c[0] as any).name === 'uBandTight')
      .map((c) => c[1])
    expect(bandTightValues[bandTightValues.length - 1]).toBe(200)

    expect(() => ctrl!.destroy()).not.toThrow()
    expect(gl.deleteProgram).toHaveBeenCalled()
    expect(gl.deleteBuffer).toHaveBeenCalled()
    expect(gl.deleteShader).toHaveBeenCalledTimes(2)
  })
})
