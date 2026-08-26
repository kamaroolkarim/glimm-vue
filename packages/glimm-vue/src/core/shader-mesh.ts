import { resolvePalette } from './palettes'
import type { Direction, MeshIdeaFlags, MeshShaderController, Palette } from './types'

const DEFAULT_IDEA_FLAGS: MeshIdeaFlags = {
  asymmetricSwell: 0,
  secondaryCrest: 0,
  refraction: 0,
  chromaticDispersion: 0,
  noiseEdge: 0,
  cameraSweep: 0,
  bloom: 0,
  sparkles: 0,
  curlWake: 0
}
const VS2 = `
attribute vec3 aPos;
attribute vec2 aUV;
uniform float uProgress;
uniform float uPosStart;
uniform float uPosEnd;
uniform float uBandTight;
uniform float uDirection;
uniform float uTime;
uniform float uWaveAmount;
uniform float uWaveSpeed;
uniform float uElevation;
uniform float uDistance;
uniform float uAspect;
uniform mat4  uProj;
// Idea blending amounts. 0 = base behaviour, 1 = idea fully applied.
uniform float uIdea1Asym;
uniform float uIdea2Secondary;
uniform float uIdea5Noise;
uniform float uIdea6Camera;
uniform float uIdea9Curl;
varying vec2  vUV;
varying float vZ;
varying float vD;
varying float vBand;

// 1-input hash (Inigo Quilez / Dave_Hoskins style). Cheap, no texture.
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  float axis  = mix(aUV.x, aUV.y, uDirection);
  float cross = mix(aUV.y, aUV.x, uDirection);
  float pos   = uPosStart + uProgress * (uPosEnd - uPosStart);
  float tw    = uTime * uWaveSpeed;

  // Base sine-harmonic edge wave. Same recipe as the fullscreen shader.
  float waveSine =
      sin(cross *  6.0 + tw * 1.3) * 0.020
    + sin(cross * 13.0 - tw * 0.9 + 1.4) * 0.012
    + sin(cross * 21.0 + tw * 1.7 + 2.6) * 0.006;

  // Idea 5: replace the sine harmonics with hash noise so the crest
  // line stops feeling periodic. Sampled in (cross, time) so it
  // animates rather than freezing in place. Blended via uIdea5Noise.
  float waveNoise = (hash21(vec2(cross * 7.5, tw * 0.45)) - 0.5) * 0.05;
  float waveX = mix(waveSine, waveNoise, uIdea5Noise) * uWaveAmount;

  float d = (axis - pos) - waveX;

  // Idea 1: asymmetric swell \u2014 leading face steeper, trailing wake
  // gentler. step(0, d) picks the leading side (d > 0 means we're
  // ahead of the crest), so we apply a higher tightness there and a
  // lower one in the wake.
  float kLead  = uBandTight * mix(1.0, 1.7, uIdea1Asym);
  float kTrail = uBandTight * mix(1.0, 0.55, uIdea1Asym);
  float k = mix(kTrail, kLead, step(0.0, d));
  float band = exp(-d * d * k);

  // Idea 2: secondary crest \u2014 a smaller bump trailing the primary peak
  // at d \u2248 0.12. Adds to band so both the elevation and the FS-side
  // intensity get the doubled silhouette.
  float secondary = exp(-(d - 0.12) * (d - 0.12) * uBandTight * 2.5) * 0.4;
  band += secondary * uIdea2Secondary;
  band = clamp(band, 0.0, 1.4);

  vec3 p = aPos;
  // Stretch the plane horizontally by uAspect so it always fills the
  // viewport regardless of canvas aspect; vertical stays at [-1, 1].
  p.x *= uAspect;
  p.z = band * uElevation;

  // Idea 9: curl wake \u2014 vertices behind the crest are pulled back
  // along the travel axis, mimicking the sticker peel's "the material
  // folds over itself instead of hovering" trick. exp(d*4) decays the
  // pull as we move further into the wake. Only applies for d < 0.
  float wakeMask = exp(min(d, 0.0) * 4.0) * (1.0 - step(0.0, d));
  vec2 axisDirUV = vec2(mix(1.0, 0.0, uDirection), mix(0.0, 1.0, uDirection));
  p.xy -= axisDirUV * 0.35 * wakeMask * uIdea9Curl;

  // Idea 6: camera sweep \u2014 gentle dolly that pushes the crest forward
  // when the band is in the middle of its traversal. sin(progress*PI)
  // peaks at uProgress=0.5 and is zero at the ends, so the dolly is
  // synced to the band, not the clock.
  float dolly = sin(uProgress * 3.14159) * 0.55 * uIdea6Camera;

  vec3 viewP = vec3(p.x, p.y, -uDistance + p.z + dolly);
  vUV = aUV;
  vZ = viewP.z;
  vD = d;
  vBand = band;
  gl_Position = uProj * vec4(viewP, 1.0);
}
`
const FS2 = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2  vUV;
varying float vZ;
varying float vD;
varying float vBand;
uniform vec2  uRes;
uniform float uTime;
uniform float uProgress;
uniform float uAlpha;
uniform float uDirection;
uniform float uHueShift;
uniform float uBrightness;
uniform float uSwellAmount;
uniform float uAspect;
uniform float uDistance;
uniform vec3  uPalA;
uniform vec3  uPalB;
uniform vec3  uPalC;
uniform vec3  uPalD;
// FS-side idea amounts (matches uIdeaN naming used in VS for clarity).
uniform float uIdea3Refraction;
uniform float uIdea4Chromatic;
uniform float uIdea7Bloom;
uniform float uIdea8Sparkles;
// HTML-in-canvas texture support \u2014 when uUseTexture > 0, the band's
// body samples from this texture (the live page rasterised via
// drawElementImage) instead of emitting pure palette colour. The
// page swells with the mesh's z-displacement plus an N.xy-driven UV
// offset (uRefractStrength) that lenses light at the rim.
uniform sampler2D uTex;
uniform float uUseTexture;
uniform float uRefractStrength;
// MARGIN value the JS-side projection uses \u2014 needed to remap plane UV
// (which spans the overdrawn plane) into viewport UV (the un-displaced
// screen position) for the texture sample. Otherwise the page texture
// reads zoomed-in by 1/MARGIN.
uniform float uTexMargin;

#define PI 3.14159265359

vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(2.0 * PI * (c * t + d));
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  // Real screen-space normal from vZ derivatives. The 90.0 gain is the
  // same one sticker-gl.ts uses; it balances tilt sensitivity vs.
  // per-pixel noise from finite-difference normals.
  vec3 N = normalize(vec3(-dFdx(vZ) * 90.0, dFdy(vZ) * 90.0, 1.0));

  // View-space surface point (matches sticker-gl.ts's camera setup).
  vec3 surfPos = vec3((vUV.x - 0.5) * 2.0 * uAspect,
                      (0.5 - vUV.y) * 2.0,
                      vZ);
  // Fixed key light, parked off-screen up-and-to-the-left.
  vec3 lightPos = vec3(-0.4, 0.6, -uDistance + 1.6);
  vec3 L = normalize(lightPos - surfPos);
  vec3 V = normalize(-surfPos);
  vec3 H = normalize(L + V);
  vec3 R = reflect(-L, N);

  float NdotH = clamp(dot(N, H), 0.0, 1.0);
  float NdotV = clamp(dot(N, V), 0.0, 1.0);

  // Trailing wake \u2014 same dark-side glow that the flat shader uses, so
  // the band still has something behind it instead of a hard cutoff.
  float trail = clamp(0.5 - vD * 1.3, 0.0, 1.0);
  trail = pow(trail, 2.5) * 0.30;
  float intensity = max(vBand * 0.95, trail);

  float axis = mix(vUV.x, vUV.y, uDirection);
  // Edge taper driven by *screen-space* coords, not plane UV. The mesh
  // overdraws the viewport (MARGIN < 1 on the JS side), so plane-UV
  // edges sit off-screen and a UV-based fade would be invisible.
  // Sampling gl_FragCoord keeps the fade tied to actual viewport edges.
  vec2 screenUV = gl_FragCoord.xy / uRes;
  float screenCross = mix(screenUV.y, screenUV.x, uDirection);
  float vfade = smoothstep(0.0, 0.015, screenCross) * smoothstep(1.0, 0.985, screenCross);

  // Iridescence \u2014 hue driven primarily by the reflection vector (which
  // rotates as the crest rises and falls), with a slow secondary drift
  // from axis + time. This is the bit that reads as iOS-name-drop foil.
  float hueT = R.x * 1.1 + R.y * 0.7
             + axis * 0.6
             + uHueShift + uTime * 0.04;

  // Idea 4: chromatic dispersion \u2014 sample the palette at three offset
  // hues and recombine per RGB channel. Reads as a prism split on
  // edges where the normal tilts hard.
  float disp = 0.08 * uIdea4Chromatic;
  vec3 colCenter = pal(hueT,        uPalA, uPalB, uPalC, uPalD);
  vec3 colR      = pal(hueT + disp, uPalA, uPalB, uPalC, uPalD);
  vec3 colB      = pal(hueT - disp, uPalA, uPalB, uPalC, uPalD);
  vec3 colSplit  = vec3(colR.r, colCenter.g, colB.b);
  vec3 col = mix(colCenter, colSplit, uIdea4Chromatic) * uBrightness;

  float fresnel = pow(1.0 - NdotV, 3.0);
  float spec    = pow(NdotH, 64.0);

  // Idea 7: bloom (fake) \u2014 adds a wider, softer halo around the tight
  // catch-light. Real bloom would need an FBO + blur; this is the
  // cheapest 1-pass approximation that still reads as glow.
  float bloomHalo = pow(NdotH, 8.0) * uIdea7Bloom * 0.85;

  float entryFade = mix(0.2, 1.0, 4.0 * uProgress * (1.0 - uProgress));

  // Idea 3: fake refraction \u2014 when the surface tilts hard (low N.z),
  // body alpha drops so the page behind shows through. Reads as a
  // lens bending light rather than a coloured stripe. Body alpha is
  // multiplied by N.z (mapped through uIdea3Refraction).
  float refractMask = mix(1.0, N.z, uIdea3Refraction * 0.85);

  float bodyA  = intensity * vfade * uAlpha * entryFade * refractMask;
  vec3  bodyPM = col * bodyA;

  // Texture mode: read the live page (rasterised via html-in-canvas)
  // at a UV that's been offset by the screen-space normal. The
  // mesh's z displacement already foreshortens the texture over the
  // crest; this extra refraction adds glass-lens lateral bend, which
  // is what reads as "the page is actually swelling" rather than just
  // being colour-tinted. Texture sample is opaque so we override the
  // body's premultiplied colour + alpha completely.
  if (uUseTexture > 0.5) {
    // Remap plane UV \u2192 viewport UV. The plane overdraws the viewport
    // by 1/uTexMargin so the visible region only spans the central
    // strip of vUV; rescale it to span [0, 1] of the texture.
    vec2 viewportUV = (vUV - 0.5) / uTexMargin + 0.5;
    // FLIP_Y=true is set at upload (matches THREE.CanvasTexture's
    // default). With that flip, GL texture-Y=0 corresponds to the
    // page TOP. Our mesh has vUV.y=0 at the viewport top, so we
    // sample at viewportUV directly with no further inversion.
    vec2 sampleUV = viewportUV + N.xy * uRefractStrength * vBand;
    vec3 page = texture2D(uTex, clamp(sampleUV, vec2(0.0), vec2(1.0))).rgb;
    // Body composite: page texture as base everywhere; iridescent
    // band colour ADDED on top, weighted by vBand. Mixing was
    // washing out the colour against the typical white page
    // background. Additive composition keeps the page legible
    // away from the band and lets the band read as a bright
    // overlay where it passes \u2014 like a glossy iridescent strip
    // sliding across the page.
    bodyA = vfade * uAlpha;
    vec3 bandOverlay = col * vBand * 1.6;
    bodyPM = (page + bandOverlay) * bodyA;
  }

  float highMask = vBand * vfade * uAlpha * entryFade * uSwellAmount;
  vec3  highEmit = (col * fresnel * 0.55 + vec3(spec) * 1.2 + col * bloomHalo) * highMask;
  float highA    = (fresnel * 0.4 + spec * 0.9 + bloomHalo * 0.7) * highMask;

  // Idea 8: wake sparkles \u2014 tile-quantised hash noise sampled at a
  // coarse grid so the twinkle is point-like, not a uniform mist.
  // Restricted to the wake region (where trail > 0) so the body of
  // the band stays clean.
  float sGrid = 140.0;
  float sSeed = hash21(floor(vUV * sGrid + floor(uTime * 14.0)));
  float sparkle = step(0.965, sSeed) * trail * uIdea8Sparkles;
  highEmit += vec3(sparkle * 1.6) * vfade * uAlpha;
  highA    += sparkle * 1.0 * vfade * uAlpha;

  gl_FragColor = vec4(bodyPM + highEmit, clamp(bodyA + highA, 0.0, 1.0));
}
`
const dirToUniforms2 = (d: Direction) => {
  switch (d) {
    case "ltr":
      return { axis: 0, posStart: -0.2, posEnd: 1.2 };
    case "rtl":
      return { axis: 0, posStart: 1.2, posEnd: -0.2 };
    case "ttb":
      return { axis: 1, posStart: -0.2, posEnd: 1.2 };
    case "btt":
      return { axis: 1, posStart: 1.2, posEnd: -0.2 };
  }
}
function perspectiveProj(fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    2 * far * near / (near - far),
    0
  ]);
}
export function createMeshShader(opts: {
  canvas?: HTMLCanvasElement;
  palette?: Palette;
  bandTight?: number;
  direction?: Direction;
  waveAmount?: number;
  rippleAmount?: number;
  waveSpeed?: number;
  brightness?: number;
  swellAmount?: number;
  /** Peak z displacement of the crest, in plane units. Default 0.18. */
  elevation?: number;
  /** Mesh subdivision. Higher = smoother normals, more vertex work.
   *  Default 96 × 56. */
  cols?: number;
  rows?: number;
  /** Initial values for the nine experimental idea flags. Each is 0..1;
   *  default all-zero (base mesh look). */
  ideas?: Partial<MeshIdeaFlags>;
} = {}): MeshShaderController | null {
  if (typeof window === "undefined") return null;
  const canvas = opts.canvas ?? document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true
  });
  if (!gl) return null;
  if (!gl.getExtension("OES_standard_derivatives")) {
    console.warn("[glimm] OES_standard_derivatives unavailable \u2014 mesh sweep will lack proper lighting; falling back is the caller's responsibility");
    return null;
  }
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type) as WebGLShader;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("[glimm] mesh shader compile error:", gl.getShaderInfoLog(s));
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VS2);
  const fs = compile(gl.FRAGMENT_SHADER, FS2);
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const COLS = opts.cols ?? 96;
  const ROWS = opts.rows ?? 56;
  let ASPECT = 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= ROWS; j++) {
    const v = j / ROWS;
    const y = (1 - v) * 2 - 1;
    for (let i = 0; i <= COLS; i++) {
      const u2 = i / COLS;
      const x = u2 * 2 - 1;
      positions.push(x, y, 0);
      uvs.push(u2, v);
    }
  }
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = j * (COLS + 1) + i;
      const b = a + 1;
      const c = a + (COLS + 1);
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  const aUV = gl.getAttribLocation(prog, "aUV");
  gl.enableVertexAttribArray(aUV);
  gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u("uRes");
  const uProgress = u("uProgress");
  const uPosStart = u("uPosStart");
  const uPosEnd = u("uPosEnd");
  const uBandTight = u("uBandTight");
  const uDirection = u("uDirection");
  const uTime = u("uTime");
  const uAlpha = u("uAlpha");
  const uHueShift = u("uHueShift");
  const uWaveAmount = u("uWaveAmount");
  const uWaveSpeed = u("uWaveSpeed");
  const uElevation = u("uElevation");
  const uBrightness = u("uBrightness");
  const uSwellAmount = u("uSwellAmount");
  const uAspect = u("uAspect");
  const uDistance = u("uDistance");
  const uProj = u("uProj");
  const uPalA = u("uPalA");
  const uPalB = u("uPalB");
  const uPalC = u("uPalC");
  const uPalD = u("uPalD");
  const uIdea1Asym = u("uIdea1Asym");
  const uIdea2Secondary = u("uIdea2Secondary");
  const uIdea3Refraction = u("uIdea3Refraction");
  const uIdea4Chromatic = u("uIdea4Chromatic");
  const uIdea5Noise = u("uIdea5Noise");
  const uIdea6Camera = u("uIdea6Camera");
  const uIdea7Bloom = u("uIdea7Bloom");
  const uIdea8Sparkles = u("uIdea8Sparkles");
  const uIdea9Curl = u("uIdea9Curl");
  const uTex = u("uTex");
  const uUseTexture = u("uUseTexture");
  const uRefractStrength = u("uRefractStrength");
  const uTexMargin = u("uTexMargin");
  let tex: WebGLTexture | null = null;
  const ensureTexture = () => {
    if (tex) return tex;
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  };
  const DISTANCE = 3.4;
  const MARGIN = 0.7;
  gl.uniform1f(uDistance, DISTANCE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const state = {
    progress: 0,
    alpha: 0,
    palette: opts.palette ?? resolvePalette(void 0),
    bandTight: opts.bandTight ?? 14,
    direction: opts.direction ?? "ltr",
    waveAmount: opts.waveAmount ?? 1,
    rippleAmount: opts.rippleAmount ?? 1,
    waveSpeed: opts.waveSpeed ?? 1,
    brightness: opts.brightness ?? 1,
    swellAmount: opts.swellAmount ?? 0.9,
    elevation: opts.elevation ?? 0.18,
    ideas: { ...DEFAULT_IDEA_FLAGS, ...opts.ideas ?? {} } as MeshIdeaFlags,
    textureSource: null as TexImageSource | null,
    useTexture: 0,
    refractStrength: 0.025
  };
  const hueShift = Math.random() * 0.4;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    ASPECT = Math.max(0.01, w / Math.max(1, h));
    const fov = 2 * Math.atan(MARGIN / DISTANCE);
    const proj = perspectiveProj(fov, ASPECT, 0.1, 10);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(uProj, false, proj);
    gl.uniform1f(uAspect, ASPECT);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const start = performance.now();
  let raf = 0;
  const tick = () => {
    const t = (performance.now() - start) / 1e3;
    const dirU = dirToUniforms2(state.direction);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uProgress, state.progress);
    gl.uniform1f(uAlpha, state.alpha);
    gl.uniform1f(uBandTight, state.bandTight);
    gl.uniform1f(uPosStart, dirU.posStart);
    gl.uniform1f(uPosEnd, dirU.posEnd);
    gl.uniform1f(uDirection, dirU.axis);
    gl.uniform1f(uWaveAmount, state.waveAmount);
    gl.uniform1f(uWaveSpeed, state.waveSpeed);
    gl.uniform1f(uBrightness, state.brightness);
    gl.uniform1f(uSwellAmount, state.swellAmount);
    gl.uniform1f(uElevation, state.elevation);
    gl.uniform1f(uHueShift, hueShift);
    gl.uniform3f(uPalA, state.palette.a[0], state.palette.a[1], state.palette.a[2]);
    gl.uniform3f(uPalB, state.palette.b[0], state.palette.b[1], state.palette.b[2]);
    gl.uniform3f(uPalC, state.palette.c[0], state.palette.c[1], state.palette.c[2]);
    gl.uniform3f(uPalD, state.palette.d[0], state.palette.d[1], state.palette.d[2]);
    gl.uniform1f(uIdea1Asym, state.ideas.asymmetricSwell);
    gl.uniform1f(uIdea2Secondary, state.ideas.secondaryCrest);
    gl.uniform1f(uIdea3Refraction, state.ideas.refraction);
    gl.uniform1f(uIdea4Chromatic, state.ideas.chromaticDispersion);
    gl.uniform1f(uIdea5Noise, state.ideas.noiseEdge);
    gl.uniform1f(uIdea6Camera, state.ideas.cameraSweep);
    gl.uniform1f(uIdea7Bloom, state.ideas.bloom);
    gl.uniform1f(uIdea8Sparkles, state.ideas.sparkles);
    gl.uniform1f(uIdea9Curl, state.ideas.curlWake);
    if (state.useTexture > 0 && state.textureSource) {
      ensureTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      try {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, state.textureSource);
      } catch {
      }
      gl.uniform1i(uTex, 0);
      gl.uniform1f(uUseTexture, 1);
    } else {
      gl.uniform1f(uUseTexture, 0);
    }
    gl.uniform1f(uRefractStrength, state.refractStrength);
    gl.uniform1f(uTexMargin, MARGIN);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return {
    canvas,
    setProgress: (p) => {
      state.progress = p;
    },
    setAlpha: (a) => {
      state.alpha = a;
    },
    setPalette: (p) => {
      state.palette = p;
    },
    setBandTight: (b) => {
      state.bandTight = b;
    },
    setDirection: (d) => {
      state.direction = d;
    },
    setWaveAmount: (v) => {
      state.waveAmount = v;
    },
    setRippleAmount: (v) => {
      state.rippleAmount = v;
    },
    setWaveSpeed: (v) => {
      state.waveSpeed = v;
    },
    setBrightness: (v) => {
      state.brightness = v;
    },
    setSwellAmount: (v) => {
      state.swellAmount = v;
    },
    setElevation: (v) => {
      state.elevation = v;
    },
    setIdea: (key, value) => {
      state.ideas = { ...state.ideas, [key]: value };
    },
    setIdeas: (flags) => {
      state.ideas = { ...flags };
    },
    setTextureSource: (src) => {
      state.textureSource = src;
    },
    setUseTexture: (on) => {
      state.useTexture = on;
    },
    setRefractStrength: (v) => {
      state.refractStrength = v;
    },
    getProgress: () => state.progress,
    getAlpha: () => state.alpha,
    destroy: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(idxBuf);
      if (tex) gl.deleteTexture(tex);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    }
  };
}
