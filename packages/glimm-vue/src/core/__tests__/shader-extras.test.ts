import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../palettes', () => ({
  resolvePalette: () => ({ a: [0, 0, 0], b: [0, 0, 0], c: [1, 1, 1], d: [0, 0, 0] })
}))

import { createMeshShader } from '../shader-mesh'
import { createNamedropShader } from '../shader-namedrop'

function makeGL() {
  return {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    ELEMENT_ARRAY_BUFFER: 6,
    STATIC_DRAW: 7,
    FLOAT: 8,
    BLEND: 9,
    ONE: 10,
    ONE_MINUS_SRC_ALPHA: 11,
    COLOR_BUFFER_BIT: 12,
    TRIANGLES: 13,
    UNSIGNED_SHORT: 14,
    UNSIGNED_BYTE: 15,
    RGBA: 16,
    TEXTURE_2D: 17,
    TEXTURE_WRAP_S: 18,
    TEXTURE_WRAP_T: 19,
    CLAMP_TO_EDGE: 20,
    TEXTURE_MIN_FILTER: 21,
    TEXTURE_MAG_FILTER: 22,
    LINEAR: 23,
    TEXTURE0: 24,
    TEXTURE1: 25,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 26,
    UNPACK_FLIP_Y_WEBGL: 27,
    getExtension: vi.fn(() => ({} as object | null)),
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
    createTexture: vi.fn(() => ({})),
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    pixelStorei: vi.fn(),
    texImage2D: vi.fn(),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    viewport: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform1i: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    drawElements: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteTexture: vi.fn(),
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

const lastUniform1f = (gl: ReturnType<typeof makeGL>, name: string) => {
  const values = gl.uniform1f.mock.calls
    .filter((c) => (c[0] as any).name === name)
    .map((c) => c[1])
  return values[values.length - 1]
}

const lastUniform2f = (gl: ReturnType<typeof makeGL>, name: string) => {
  const values = gl.uniform2f.mock.calls.filter((c) => (c[0] as any).name === name)
  return values[values.length - 1]
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
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  rafCallback = null
})

describe('createMeshShader', () => {
  it('returns null when WebGL is unavailable', () => {
    expect(createMeshShader()).toBeNull()
  })

  it('returns null when getContext returns null', () => {
    const canvas = {
      getContext: () => null,
      getBoundingClientRect: () => ({ width: 100, height: 50 }),
      style: {}
    } as any
    expect(createMeshShader({ canvas })).toBeNull()
  })

  it('returns null when OES_standard_derivatives is unavailable', () => {
    const gl = makeGL()
    gl.getExtension.mockReturnValue(null)
    const ctrl = createMeshShader({ canvas: makeCanvas(gl) })
    expect(ctrl).toBeNull()
  })

  it('creates a controller, uploads defaults per frame and destroys', () => {
    const gl = makeGL()
    const canvas = makeCanvas(gl)
    const ctrl = createMeshShader({ canvas })

    expect(ctrl).not.toBeNull()
    expect(ctrl!.canvas).toBe(canvas)
    expect(gl.blendFunc).toHaveBeenCalledWith(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    expect(gl.enable).toHaveBeenCalledWith(gl.BLEND)
    expect(gl.viewport).toHaveBeenCalledWith(0, 0, 100, 50)
    expect(typeof ctrl!.setIdea).toBe('function')
    expect(typeof ctrl!.setIdeas).toBe('function')
    expect(typeof ctrl!.setElevation).toBe('function')
    expect(typeof ctrl!.setTextureSource).toBe('function')
    expect(typeof ctrl!.setUseTexture).toBe('function')
    expect(typeof ctrl!.setRefractStrength).toBe('function')

    flushFrame()
    expect(gl.clearColor).toHaveBeenCalledWith(0, 0, 0, 0)
    expect(gl.clear).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT)
    expect(gl.drawElements).toHaveBeenCalledWith(
      gl.TRIANGLES,
      96 * 56 * 6,
      gl.UNSIGNED_SHORT,
      0
    )
    expect(lastUniform1f(gl, 'uElevation')).toBe(0.18)
    expect(lastUniform1f(gl, 'uBandTight')).toBe(14)
    expect(lastUniform1f(gl, 'uSwellAmount')).toBe(0.9)
    expect(lastUniform1f(gl, 'uRefractStrength')).toBe(0.025)
    expect(lastUniform1f(gl, 'uTexMargin')).toBe(0.7)
    expect(lastUniform1f(gl, 'uUseTexture')).toBe(0)
    expect(lastUniform1f(gl, 'uIdea1Asym')).toBe(0)
    expect(lastUniform1f(gl, 'uIdea9Curl')).toBe(0)

    expect(() => ctrl!.destroy()).not.toThrow()
    expect(gl.deleteProgram).toHaveBeenCalled()
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(3)
    expect(gl.deleteShader).toHaveBeenCalledTimes(2)
    expect(gl.deleteTexture).not.toHaveBeenCalled()
  })

  it('honours custom cols/rows', () => {
    const gl = makeGL()
    const ctrl = createMeshShader({ canvas: makeCanvas(gl), cols: 8, rows: 4 })
    expect(ctrl).not.toBeNull()
    flushFrame()
    expect(gl.drawElements).toHaveBeenCalledWith(
      gl.TRIANGLES,
      8 * 4 * 6,
      gl.UNSIGNED_SHORT,
      0
    )
    ctrl!.destroy()
  })

  it('setters store values unclamped (as in the bundle)', () => {
    const gl = makeGL()
    const ctrl = createMeshShader({ canvas: makeCanvas(gl) })

    ctrl!.setProgress(2)
    expect(ctrl!.getProgress()).toBe(2)
    ctrl!.setAlpha(-0.5)
    expect(ctrl!.getAlpha()).toBe(-0.5)

    ctrl!.setElevation(0.5)
    flushFrame()
    expect(lastUniform1f(gl, 'uElevation')).toBe(0.5)

    ctrl!.destroy()
  })

  it('setIdea and setIdeas update the idea flag uniforms', () => {
    const gl = makeGL()
    const ctrl = createMeshShader({ canvas: makeCanvas(gl) })

    ctrl!.setIdea('sparkles', 1)
    flushFrame()
    expect(lastUniform1f(gl, 'uIdea8Sparkles')).toBe(1)
    expect(lastUniform1f(gl, 'uIdea1Asym')).toBe(0)

    ctrl!.setIdeas({
      asymmetricSwell: 1,
      secondaryCrest: 0.5,
      refraction: 0,
      chromaticDispersion: 0,
      noiseEdge: 0,
      cameraSweep: 0,
      bloom: 0,
      sparkles: 0,
      curlWake: 0.75
    })
    flushFrame()
    expect(lastUniform1f(gl, 'uIdea1Asym')).toBe(1)
    expect(lastUniform1f(gl, 'uIdea2Secondary')).toBe(0.5)
    expect(lastUniform1f(gl, 'uIdea9Curl')).toBe(0.75)
    expect(lastUniform1f(gl, 'uIdea8Sparkles')).toBe(0)

    ctrl!.destroy()
  })

  it('lazily creates and uploads the texture each frame; null clears it', () => {
    const gl = makeGL()
    const ctrl = createMeshShader({ canvas: makeCanvas(gl) })

    flushFrame()
    expect(gl.createTexture).not.toHaveBeenCalled()

    const src = { tag: 'source' } as any
    ctrl!.setTextureSource(src)
    ctrl!.setUseTexture(1)
    flushFrame()
    expect(gl.createTexture).toHaveBeenCalledTimes(1)
    expect(gl.texImage2D).toHaveBeenCalledWith(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      src
    )
    expect(gl.uniform1i).toHaveBeenCalledWith({ name: 'uTex' }, 0)
    expect(lastUniform1f(gl, 'uUseTexture')).toBe(1)

    ctrl!.setTextureSource(null)
    flushFrame()
    expect(gl.texImage2D).toHaveBeenCalledTimes(1)
    expect(lastUniform1f(gl, 'uUseTexture')).toBe(0)

    ctrl!.destroy()
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1)
  })
})

describe('createNamedropShader', () => {
  it('returns null when WebGL is unavailable', () => {
    expect(createNamedropShader()).toBeNull()
  })

  it('returns null when getContext returns null', () => {
    const canvas = {
      getContext: () => null,
      getBoundingClientRect: () => ({ width: 100, height: 50 }),
      style: {}
    } as any
    expect(createNamedropShader({ canvas })).toBeNull()
  })

  it('returns null when OES_standard_derivatives is unavailable', () => {
    const gl = makeGL()
    gl.getExtension.mockReturnValue(null)
    const ctrl = createNamedropShader({ canvas: makeCanvas(gl) })
    expect(ctrl).toBeNull()
  })

  it('returns null on program link failure', () => {
    const gl = makeGL()
    gl.getProgramParameter.mockReturnValue(false)
    const ctrl = createNamedropShader({ canvas: makeCanvas(gl) })
    expect(ctrl).toBeNull()
  })

  it('creates a controller, uploads defaults per frame and destroys', () => {
    const gl = makeGL()
    const canvas = makeCanvas(gl)
    const ctrl = createNamedropShader({ canvas })

    expect(ctrl).not.toBeNull()
    expect(ctrl!.canvas).toBe(canvas)
    expect(gl.blendFunc).toHaveBeenCalledWith(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    expect(gl.enable).toHaveBeenCalledWith(gl.BLEND)
    expect(lastUniform1f(gl, 'uDistance')).toBe(3.4)
    expect(lastUniform1f(gl, 'uTexMargin')).toBe(0.7)
    expect(typeof ctrl!.setTextureSource).toBe('function')
    expect(typeof ctrl!.setUseTexture).toBe('function')
    expect(typeof ctrl!.setSnapshotSource).toBe('function')
    expect(typeof ctrl!.setAnchor).toBe('function')
    expect(typeof ctrl!.setBulgeRadius).toBe('function')
    expect(typeof ctrl!.setElevation).toBe('function')
    expect(typeof ctrl!.setIridescence).toBe('function')
    expect(typeof ctrl!.setRefractStrength).toBe('function')
    expect(typeof ctrl!.setTravelMode).toBe('function')

    flushFrame()
    expect(gl.drawElements).toHaveBeenCalledWith(
      gl.TRIANGLES,
      96 * 56 * 6,
      gl.UNSIGNED_SHORT,
      0
    )
    const anchor = lastUniform2f(gl, 'uAnchor')
    expect(anchor[1]).toBe(0.5)
    expect(anchor[2]).toBe(0.5)
    expect(lastUniform1f(gl, 'uBulgeRadius')).toBe(0.55)
    expect(lastUniform1f(gl, 'uElevation')).toBe(0.32)
    expect(lastUniform1f(gl, 'uIridescence')).toBe(1)
    expect(lastUniform1f(gl, 'uRefractStrength')).toBe(0.04)
    expect(lastUniform1f(gl, 'uTravelMode')).toBe(0)
    expect(lastUniform1f(gl, 'uUseTexture')).toBe(0)
    expect(lastUniform1f(gl, 'uHasSnapshot')).toBe(0)

    expect(() => ctrl!.destroy()).not.toThrow()
    expect(gl.deleteProgram).toHaveBeenCalled()
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(3)
    expect(gl.deleteShader).toHaveBeenCalledTimes(2)
  })

  it('setters store values and upload them on the next frame', () => {
    const gl = makeGL()
    const ctrl = createNamedropShader({ canvas: makeCanvas(gl) })

    ctrl!.setProgress(1.5)
    expect(ctrl!.getProgress()).toBe(1.5)
    ctrl!.setAnchor(0.25, 0.75)
    ctrl!.setBulgeRadius(0.9)
    ctrl!.setElevation(0.5)
    ctrl!.setIridescence(1.5)
    ctrl!.setRefractStrength(0.1)
    ctrl!.setTravelMode(1)
    flushFrame()

    const anchor = lastUniform2f(gl, 'uAnchor')
    expect(anchor[1]).toBe(0.25)
    expect(anchor[2]).toBe(0.75)
    expect(lastUniform1f(gl, 'uBulgeRadius')).toBe(0.9)
    expect(lastUniform1f(gl, 'uElevation')).toBe(0.5)
    expect(lastUniform1f(gl, 'uIridescence')).toBe(1.5)
    expect(lastUniform1f(gl, 'uRefractStrength')).toBe(0.1)
    expect(lastUniform1f(gl, 'uTravelMode')).toBe(1)

    ctrl!.destroy()
  })

  it('uploads the live texture and the snapshot separately', () => {
    const gl = makeGL()
    const ctrl = createNamedropShader({ canvas: makeCanvas(gl) })

    flushFrame()
    expect(gl.createTexture).not.toHaveBeenCalled()

    const src = { tag: 'live' } as any
    const snap = { tag: 'snapshot' } as any
    ctrl!.setTextureSource(src)
    ctrl!.setUseTexture(1)
    ctrl!.setSnapshotSource(snap)
    flushFrame()

    expect(gl.createTexture).toHaveBeenCalledTimes(2)
    expect(gl.texImage2D).toHaveBeenCalledWith(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      src
    )
    expect(gl.texImage2D).toHaveBeenCalledWith(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      snap
    )
    expect(gl.uniform1i).toHaveBeenCalledWith({ name: 'uTex' }, 0)
    expect(gl.uniform1i).toHaveBeenCalledWith({ name: 'uTexOld' }, 1)
    expect(lastUniform1f(gl, 'uUseTexture')).toBe(1)
    expect(lastUniform1f(gl, 'uHasSnapshot')).toBe(1)

    ctrl!.setSnapshotSource(null)
    flushFrame()
    expect(lastUniform1f(gl, 'uHasSnapshot')).toBe(0)

    ctrl!.destroy()
    expect(gl.deleteTexture).toHaveBeenCalledTimes(2)
  })
})
