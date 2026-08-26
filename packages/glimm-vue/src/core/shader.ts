import type { Direction, Palette, ShaderController } from './types'
import { resolvePalette } from './palettes'

const VS = `
attribute vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }
`
const FS = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uProgress;
uniform float uAlpha;
uniform float uBandTight;
uniform float uPosStart;
uniform float uPosEnd;
uniform float uHueShift;
uniform float uDirection; // 0 = horizontal, 1 = vertical
uniform float uWaveAmount;   // 0..2, multiplies edge wave displacement
uniform float uRippleAmount; // 0..2, multiplies vertical ripple intensity
uniform float uWaveSpeed;    // 0..3, multiplies all time-based motion
uniform float uBrightness;   // 0..1.5, scales the band's RGB before composite
uniform float uSwellAmount;  // 0..1, depth/iridescence intensity. 0 = flat band.
uniform vec3 uPalA;
uniform vec3 uPalB;
uniform vec3 uPalC;
uniform vec3 uPalD;

#define PI 3.14159265359

vec3 pal(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
  return a + b * cos(2.0 * PI * (c * t + d));
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float axis  = mix(uv.x, uv.y, uDirection);
  float cross = mix(uv.y, uv.x, uDirection);

  float pos = uPosStart + uProgress * (uPosEnd - uPosStart);

  float tw = uTime * uWaveSpeed;

  // One shallow bend keeps the silhouette organic without reading as a
  // wave. It moves less than 0.5% of the viewport and drifts slowly enough
  // to feel shaped rather than animated; richer motion stays inside the
  // foil texture below instead of distorting the band's sides.
  float waveX = sin(cross * 4.2 + tw * 0.08 + 0.3) * 0.004;
  waveX *= uWaveAmount;

  float d = (axis - pos) - waveX;
  float band = exp(-d * d * uBandTight);

  // Analytic slope of the band's pseudo-elevation map along the travel
  // axis only. We deliberately ignore the cross-axis chain-rule term
  // (∂waveX/∂cross) — letting the high-frequency edge wobble leak into
  // the normal made iridescence shimmer at the wave's frequency, which
  // read as "too wavy". Keeping the cross slope at zero gives a clean
  // left→right hue sweep that matches the iOS name-drop feel.
  float dhDaxis = -2.0 * d * uBandTight * band;
  vec2 slope;
  slope.x = mix(dhDaxis, 0.0, uDirection);
  slope.y = mix(0.0, dhDaxis, uDirection);

  // Synthesised surface normal. The 0.18 gain controls perceived
  // height — higher = steeper flanks, more dramatic iridescent shift.
  vec3 N = normalize(vec3(-slope.x * 0.18, slope.y * 0.18, 1.0));

  float trail = clamp(0.5 - d * 1.3, 0.0, 1.0);
  trail = pow(trail, 2.5) * 0.30;

  // A dense crest and a very soft midpoint halo pull attention toward the
  // band while the page swaps. This improves perceptual masking without
  // turning the effect into a fullscreen cover or changing its choreography.
  float midpointFocus = 4.0 * uProgress * (1.0 - uProgress);
  float halo = exp(-d * d * 2.5) * 0.12 * midpointFocus;
  float intensity = max(band, trail);
  intensity = clamp(intensity + halo * (1.0 - band), 0.0, 1.0);

  // Cover the full screen edge-to-edge so fixed UI (tabs, toggles) is hidden
  // during the sweep. A barely-perceptible 1.5% fade keeps the look soft
  // without exposing pixels at the viewport edges.
  float vfade = smoothstep(0.0, 0.015, cross)
              * (1.0 - smoothstep(0.985, 1.0, cross));

  // Hue rotates with the synthesised normal — the trick that reads as
  // iOS-name-drop iridescence — but on a deliberately gentle scale so
  // the foil shift looks calm, not strobing.
  // Ripple changes the foil texture, not the edge geometry. Keeping those
  // responsibilities separate lets the band stay calm while its colour
  // still feels alive.
  float ripple = sin(cross * 12.0 + axis * 3.0 + tw * 0.40)
               * 0.015 * uRippleAmount;
  float t = N.x * 0.12 + N.y * 0.08
          + axis * 0.90 + cross * 0.16
          + ripple + uHueShift + uTime * 0.04;
  // Low-pass the cosine palette across neighbouring samples. This keeps
  // adjacent hues flowing into one another instead of forming hard colour
  // lanes when the surface normal changes around the crest.
  vec3 col = pal(t, uPalA, uPalB, uPalC, uPalD) * 0.50
           + pal(t - 0.18, uPalA, uPalB, uPalC, uPalD) * 0.25
           + pal(t + 0.18, uPalA, uPalB, uPalC, uPalD) * 0.25;
  col *= uBrightness;

  // Fixed key light + camera looking down +z. View-independent because
  // there's no real camera; this gives a stable highlight that travels
  // across the crest as the band moves, instead of one that wobbles with
  // viewport size.
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(0.35, 0.55, 0.9));
  vec3 H = normalize(L + V);
  float NdotH = clamp(dot(N, H), 0.0, 1.0);
  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 3.0);
  float spec    = pow(NdotH, 80.0);

  // Edge fade: as the band's traversal progress nears 0 or 1 (entering or
  // exiting the screen) the band reads at 20% alpha; at midpoint it's at
  // 100%. Softens the band's appearance/disappearance so it doesn't pop
  // into existence at full strength.
  float entryFade = mix(0.2, 1.0, 4.0 * uProgress * (1.0 - uProgress));

  // Body — palette colour where the band has presence. Premultiplied.
  float bodyA = intensity * vfade * uAlpha * entryFade;
  vec3  bodyPM = col * bodyA;

  // Highlights are emissive — they add light without occluding the page,
  // gated to the band's body so they only fire on the crest, not the wake.
  float highMask = band * vfade * uAlpha * entryFade * uSwellAmount;
  vec3  highEmit = (col * fresnel * 0.55 + vec3(spec) * 1.1) * highMask;
  float highA    = (fresnel * 0.4 + spec * 0.9) * highMask;

  gl_FragColor = vec4(bodyPM + highEmit, min(bodyA + highA, 1.0));
}
`
const dirToUniforms = (d: Direction) => {
  switch (d) {
    case 'ltr':
      return { axis: 0, posStart: -0.2, posEnd: 1.2 }
    case 'rtl':
      return { axis: 0, posStart: 1.2, posEnd: -0.2 }
    case 'ttb':
      return { axis: 1, posStart: -0.2, posEnd: 1.2 }
    case 'btt':
      return { axis: 1, posStart: 1.2, posEnd: -0.2 }
  }
}

export function createShader(opts: {
  canvas?: HTMLCanvasElement
  palette?: Palette
  bandTight?: number
  direction?: Direction
  waveAmount?: number
  rippleAmount?: number
  waveSpeed?: number
  brightness?: number
  /** 0..1, iridescent depth/swell on top of the flat band. Default 0.55;
   *  set to 0 to recover the pre-depth flat-stripe look. */
  swellAmount?: number
} = {}): ShaderController | null {
  if (typeof window === 'undefined') return null
  const canvas = opts.canvas ?? document.createElement('canvas')
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true
  })
  if (!gl) return null
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[glimm] shader compile error:', gl.getShaderInfoLog(s))
      gl.deleteShader(s)
      return null
    }
    return s
  }
  const vs = compile(gl.VERTEX_SHADER, VS)
  if (!vs) return null
  const fs = compile(gl.FRAGMENT_SHADER, FS)
  if (!fs) {
    gl.deleteShader(vs)
    return null
  }
  const prog = gl.createProgram()
  if (!prog) {
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return null
  }
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[glimm] shader link error:', gl.getProgramInfoLog(prog))
    gl.deleteProgram(prog)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return null
  }
  gl.useProgram(prog)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  )
  const aLoc = gl.getAttribLocation(prog, 'a')
  gl.enableVertexAttribArray(aLoc)
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0)
  const u = (n: string) => gl.getUniformLocation(prog, n)
  const uRes = u('uRes')
  const uTime = u('uTime')
  const uProgress = u('uProgress')
  const uAlpha = u('uAlpha')
  const uBandTight = u('uBandTight')
  const uPosStart = u('uPosStart')
  const uPosEnd = u('uPosEnd')
  const uHueShift = u('uHueShift')
  const uDirection = u('uDirection')
  const uWaveAmount = u('uWaveAmount')
  const uRippleAmount = u('uRippleAmount')
  const uWaveSpeed = u('uWaveSpeed')
  const uBrightness = u('uBrightness')
  const uSwellAmount = u('uSwellAmount')
  const uPalA = u('uPalA')
  const uPalB = u('uPalB')
  const uPalC = u('uPalC')
  const uPalD = u('uPalD')
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const state = {
    progress: 0,
    alpha: 0,
    palette: opts.palette ?? resolvePalette(void 0),
    bandTight: clamp(opts.bandTight ?? 14, 0.1, 200),
    direction: opts.direction ?? 'ltr' as Direction,
    waveAmount: clamp(opts.waveAmount ?? 0, 0, 2),
    rippleAmount: clamp(opts.rippleAmount ?? 1, 0, 2),
    waveSpeed: clamp(opts.waveSpeed ?? 1, 0, 3),
    brightness: clamp(opts.brightness ?? 1, 0, 1.5),
    swellAmount: clamp(opts.swellAmount ?? 0.55, 0, 1)
  }
  const hueShift = Math.random() * 0.4
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const r = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.round(r.width * dpr))
    const h = Math.max(1, Math.round(r.height * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  const start = performance.now()
  let raf = 0
  const tick = () => {
    const t = (performance.now() - start) / 1e3
    const dirU = dirToUniforms(state.direction)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform1f(uTime, t)
    gl.uniform1f(uProgress, state.progress)
    gl.uniform1f(uAlpha, state.alpha)
    gl.uniform1f(uBandTight, state.bandTight)
    gl.uniform1f(uPosStart, dirU.posStart)
    gl.uniform1f(uPosEnd, dirU.posEnd)
    gl.uniform1f(uDirection, dirU.axis)
    gl.uniform1f(uWaveAmount, state.waveAmount)
    gl.uniform1f(uRippleAmount, state.rippleAmount)
    gl.uniform1f(uWaveSpeed, state.waveSpeed)
    gl.uniform1f(uBrightness, state.brightness)
    gl.uniform1f(uSwellAmount, state.swellAmount)
    gl.uniform1f(uHueShift, hueShift)
    gl.uniform3f(uPalA, state.palette.a[0], state.palette.a[1], state.palette.a[2])
    gl.uniform3f(uPalB, state.palette.b[0], state.palette.b[1], state.palette.b[2])
    gl.uniform3f(uPalC, state.palette.c[0], state.palette.c[1], state.palette.c[2])
    gl.uniform3f(uPalD, state.palette.d[0], state.palette.d[1], state.palette.d[2])
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return {
    canvas,
    setProgress: (p: number) => {
      state.progress = clamp(p, 0, 1)
    },
    setAlpha: (a: number) => {
      state.alpha = clamp(a, 0, 1.5)
    },
    setPalette: (p: Palette) => {
      state.palette = p
    },
    setBandTight: (b: number) => {
      state.bandTight = clamp(b, 0.1, 200)
    },
    setDirection: (d: Direction) => {
      state.direction = d
    },
    setWaveAmount: (v: number) => {
      state.waveAmount = clamp(v, 0, 2)
    },
    setRippleAmount: (v: number) => {
      state.rippleAmount = clamp(v, 0, 2)
    },
    setWaveSpeed: (v: number) => {
      state.waveSpeed = clamp(v, 0, 3)
    },
    setBrightness: (v: number) => {
      state.brightness = clamp(v, 0, 1.5)
    },
    setSwellAmount: (v: number) => {
      state.swellAmount = clamp(v, 0, 1)
    },
    getProgress: () => state.progress,
    getAlpha: () => state.alpha,
    destroy: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }
}
