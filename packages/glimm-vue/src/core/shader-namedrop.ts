import { resolvePalette } from './palettes'
import type { Direction, NamedropController, Palette } from './types'

const VS3 = `
attribute vec3 aPos;
attribute vec2 aUV;
uniform float uProgress;
uniform vec2  uAnchor;
uniform float uBulgeRadius;
uniform float uElevation;
uniform float uAspect;
uniform float uDistance;
uniform float uTravelMode;
uniform mat4  uProj;
varying vec2  vUV;
varying float vZ;
varying float vBulge;

#define PI 3.14159265359

void main() {
  // Travel mode: anchor.x linearly traverses [-0.2, 1.2] as progress
  // goes 0\u21921 (matches the project's sweep posStart/posEnd convention).
  // Static mode: anchor stays at uAnchor.
  vec2 anchorPos = mix(uAnchor,
                       vec2(mix(-0.2, 1.2, uProgress), uAnchor.y),
                       uTravelMode);

  // Aspect-correct radial distance from anchor in UV space. Without
  // the aspect correction the bulge would render as a vertical ellipse
  // on wide viewports; this keeps it circular.
  vec2 d = (aUV - anchorPos) * vec2(uAspect, 1.0);
  float r = length(d);

  // Envelope:
  //   Static mode: sin(p\xB7\u03C0) grows to peak at progress=0.5 then
  //     deflates by progress=1.0 \u2014 the bulge swells in place.
  //   Travel mode: envelope stays at 1.0 \u2014 the bulge has constant
  //     amplitude as it traverses; it naturally fades in/out at the
  //     viewport edges as the anchor enters/leaves the screen.
  float envelope = mix(sin(uProgress * PI), 1.0, uTravelMode);

  // Radial profile \u2014 gaussian falloff inside the bulge. Effective
  // radius scales with envelope so the bulge visibly expands outward
  // as it grows, not just rises in place.
  float effR = max(uBulgeRadius * envelope, 0.001);
  float profile = exp(-(r * r) / (effR * effR));
  // Final bulge magnitude \u2014 combines envelope (overall height) with
  // radial profile (height at this vertex).
  float bulge = profile * envelope;

  vec3 p = aPos;
  // Stretch plane horizontally by aspect so it always fills the
  // viewport regardless of canvas dimensions.
  p.x *= uAspect;
  // Lift the vertex along +z toward the camera. The bulge centre
  // moves closest, edges stay flat. With perspective projection this
  // makes the centre's pixels expand outward, which reads as the
  // page surface "rising toward the screen" \u2014 the NameDrop feel.
  p.z = bulge * uElevation;

  vec3 viewP = vec3(p.x, p.y, -uDistance + p.z);
  vUV = aUV;
  vZ = viewP.z;
  vBulge = bulge;
  gl_Position = uProj * vec4(viewP, 1.0);
}
`
const FS3 = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2  vUV;
varying float vZ;
varying float vBulge;
uniform vec2  uRes;
uniform float uTime;
uniform float uProgress;
uniform float uAlpha;
uniform float uHueShift;
uniform float uAspect;
uniform float uDistance;
uniform float uIridescence;
uniform float uRefractStrength;
uniform float uTexMargin;
uniform sampler2D uTex;
uniform float uUseTexture;
// Wipe support \u2014 when uHasSnapshot is on, uTexOld holds a frozen
// snapshot of the page as it was at sweep-start. The FS mixes
// between uTex (live, "after") and uTexOld ("before") based on
// whether the fragment's viewport X is left or right of the bulge
// anchor \u2014 producing a wipe that reveals the new page as the sweep
// crosses, instead of just showing the live page everywhere with a
// bulge on top.
uniform sampler2D uTexOld;
uniform float uHasSnapshot;
uniform vec3  uPalA;
uniform vec3  uPalB;
uniform vec3  uPalC;
uniform vec3  uPalD;

#define PI 3.14159265359

vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(2.0 * PI * (c * t + d));
}

void main() {
  // Real screen-space normal from z derivatives \u2014 same trick as the
  // mesh sweep and the sticker peel. The 90.0 gain matches sticker-
  // gl.ts; balances tilt sensitivity vs. per-pixel noise on the
  // bulge's flanks.
  vec3 N = normalize(vec3(-dFdx(vZ) * 90.0, dFdy(vZ) * 90.0, 1.0));

  // Plane-UV \u2192 viewport-UV remap (mesh overdraws viewport by
  // 1/uTexMargin so plane UV [0,1] covers more than just the visible
  // area; rescale to map the visible region to texture [0,1]).
  vec2 viewportUV = (vUV - 0.5) / uTexMargin + 0.5;

  // Refraction offset: sample the page at a UV shifted by the
  // surface normal. On flat plate, N.xy \u2248 0 so no shift. On bulge
  // flanks where N tilts hardest, the page lenses outward, which
  // reads as glass-like refraction at the bulge rim.
  vec2 sampleUV = viewportUV + N.xy * uRefractStrength * vBulge;
  // pageA tracks whether we have a real page texture to render.
  // When uUseTexture is 0 (host hasn't enabled it yet, or browser
  // lacks drawElementImage) we render the bulge with TRANSPARENT
  // background instead of opaque white \u2014 the source canvas's normal
  // DOM rendering shows through the GL canvas everywhere except the
  // raised bulge area. Without this guard the GL canvas paints
  // opaque white during the first 1-2 frames of every sweep (before
  // the host's pump catches up) and the page appears to flash white.
  vec3 page = vec3(0.0);
  float pageA = 0.0;
  if (uUseTexture > 0.5) {
    vec2 clampedUV = clamp(sampleUV, vec2(0.0), vec2(1.0));
    vec3 pageLive = texture2D(uTex, clampedUV).rgb;
    if (uHasSnapshot > 0.5) {
      // Wipe mode. Project the bulge's travel-mode anchor X (plane
      // UV) into viewport UV space (matching the remap above) so we
      // can compare it to viewportUV.x. The bulge centre is the
      // wipe boundary: fragments left of it have already been
      // "passed over" (show the live/new page), fragments right of
      // it haven't yet (show the snapshot/old page). A smoothstep
      // softens the boundary into a band the width of the bulge's
      // visible falloff.
      float anchorPlaneX = mix(-0.2, 1.2, uProgress);
      float anchorViewX = (anchorPlaneX - 0.5) / uTexMargin + 0.5;
      float wipeT = smoothstep(anchorViewX - 0.08, anchorViewX + 0.08, viewportUV.x);
      vec3 pageOld = texture2D(uTexOld, clampedUV).rgb;
      // wipeT = 0 left of bulge \u2192 live (new page)
      // wipeT = 1 right of bulge \u2192 snapshot (old page)
      page = mix(pageLive, pageOld, wipeT);
    } else {
      page = pageLive;
    }
    pageA = 1.0;
  }

  // View/light setup. Light parked off-screen up-and-to-the-left so
  // the bulge has a consistent specular catch on its left flank as
  // it expands.
  vec3 surfPos = vec3((vUV.x - 0.5) * 2.0 * uAspect,
                      (0.5 - vUV.y) * 2.0,
                      vZ);
  vec3 lightPos = vec3(-0.5, 0.7, -uDistance + 1.6);
  vec3 L = normalize(lightPos - surfPos);
  vec3 V = normalize(-surfPos);
  vec3 H = normalize(L + V);
  vec3 R = reflect(-L, N);

  float NdotH = clamp(dot(N, H), 0.0, 1.0);
  float NdotV = clamp(dot(N, V), 0.0, 1.0);

  // Screen-edge taper so the bulge can dissolve cleanly into the
  // viewport edges without exposing seams from the overdrawn plane.
  // Uses (1.0 - smoothstep(0.985, 1.0, x)) instead of the reversed-
  // arg smoothstep(1.0, 0.985, x): the latter is undefined behaviour
  // per the GLSL ES spec (edge0 must be < edge1) and some drivers
  // return 0 which would zero out vfade and make the shader invisible.
  vec2 screenUV = gl_FragCoord.xy / uRes;
  float vfade = smoothstep(0.0, 0.015, screenUV.x) * (1.0 - smoothstep(0.985, 1.0, screenUV.x))
              * smoothstep(0.0, 0.015, screenUV.y) * (1.0 - smoothstep(0.985, 1.0, screenUV.y));

  // Iridescent palette \u2014 hue driven primarily by the reflection
  // vector (rotates with normal tilt) plus a slow time/spatial
  // drift. This is what reads as NameDrop's foil shimmer.
  float hueT = R.x * 1.4 + R.y * 0.9
             + viewportUV.x * 0.3 + viewportUV.y * 0.2
             + uHueShift + uTime * 0.06;
  vec3 iri = pal(hueT, uPalA, uPalB, uPalC, uPalD);

  // Bulge surface highlights \u2014 Fresnel rim catches the bulge's
  // silhouette; tight specular gives a glass catch-light on the
  // crest. Both gated by vBulge so the flat plate stays clean.
  float fresnel = pow(1.0 - NdotV, 3.0) * vBulge;
  float spec    = pow(NdotH, 96.0) * vBulge;

  // Chromatic dispersion at the bulge edges \u2014 sample the palette
  // at three offset hues per RGB channel where the normal tilts
  // hard. Gives the rim a prismatic split, the NameDrop touch that
  // separates it from a generic radial gradient.
  float dispersion = (1.0 - NdotV) * vBulge * 0.06;
  vec3 iriR = pal(hueT + dispersion, uPalA, uPalB, uPalC, uPalD);
  vec3 iriB = pal(hueT - dispersion, uPalA, uPalB, uPalC, uPalD);
  vec3 iriSplit = vec3(iriR.r, iri.g, iriB.b);

  // Composite. Two modes:
  //   uUseTexture=1 (pageA=1): page covers viewport opaquely; bulge
  //     warps it visually + iridescent shimmer overlays the bulge.
  //   uUseTexture=0 (pageA=0): GL stays transparent except for the
  //     bulge area \u2014 the source canvas's normal DOM rendering shows
  //     through everywhere else.
  //
  // bodyA controls the GL canvas's opacity at this fragment. In
  // texture mode it's fully opaque (we *are* the page). Outside
  // texture mode it follows vBulge so flat areas read transparent.
  float bulgePresence = clamp(vBulge * 1.4, 0.0, 1.0);
  float bodyA = pageA + (1.0 - pageA) * bulgePresence;
  // bodyRgb is the page texture in texture mode; in fallback mode
  // it's just the iridescent palette colour weighted by vBulge so
  // the bulge area has *something* to show even with no texture.
  vec3 bodyRgb = page + (1.0 - pageA) * iri * vBulge;

  vec3 iriOverlay = iriSplit * vBulge * uIridescence * 0.55;
  vec3 highlights = iri * fresnel * 0.6 + vec3(spec) * 1.3;
  vec3 col = bodyRgb + iriOverlay + highlights * uIridescence;

  // Same reversed-arg avoidance as vfade above \u2014 entryFade ramps in
  // over progress 0..0.05, then out over 0.95..1.0.
  float entryFade = smoothstep(0.0, 0.05, uProgress) * (1.0 - smoothstep(0.95, 1.0, uProgress));
  float alpha = bodyA * vfade * uAlpha * entryFade;

  // Premultiplied alpha output (matches the project's blendFunc:
  // ONE, ONE_MINUS_SRC_ALPHA).
  gl_FragColor = vec4(col * alpha, alpha);
}
`
function perspectiveProj2(fov: number, aspect: number, near: number, far: number) {
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
export function createNamedropShader(opts: {
  canvas?: HTMLCanvasElement;
  palette?: Palette;
  direction?: Direction;
  bandTight?: number;
  /** Mesh subdivision. Default 96 × 56. */
  cols?: number;
  rows?: number;
  /** UV anchor of the bulge centre. Default (0.5, 0.5). */
  anchor?: [number, number];
  /** Max radial extent. Default 0.55. */
  bulgeRadius?: number;
  /** Peak z displacement. Default 0.32. */
  elevation?: number;
  /** Iridescent foil intensity. Default 1. */
  iridescence?: number;
  /** UV refraction strength at bulge rim. Default 0.04. */
  refractStrength?: number;
  /** 0 = static anchor, 1 = traveling left→right. Default 0. */
  travelMode?: number;
} = {}): NamedropController | null {
  if (typeof window === "undefined") return null;
  const canvas = opts.canvas ?? document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true
  });
  if (!gl) return null;
  if (!gl.getExtension("OES_standard_derivatives")) {
    console.warn("[glimm/namedrop] OES_standard_derivatives unavailable \u2014 bulge lighting will be missing");
    return null;
  }
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type) as WebGLShader;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("[glimm/namedrop] shader compile error:", gl.getShaderInfoLog(s));
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VS3);
  const fs = compile(gl.FRAGMENT_SHADER, FS3);
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("[glimm/namedrop] program link error:", gl.getProgramInfoLog(prog));
    return null;
  }
  console.log("[glimm/namedrop] shader created, canvas:", canvas.width, "x", canvas.height);
  const COLS = opts.cols ?? 96;
  const ROWS = opts.rows ?? 56;
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
  const uTime = u("uTime");
  const uProgress = u("uProgress");
  const uAlpha = u("uAlpha");
  const uHueShift = u("uHueShift");
  const uAspect = u("uAspect");
  const uDistance = u("uDistance");
  const uAnchor = u("uAnchor");
  const uBulgeRadius = u("uBulgeRadius");
  const uElevation = u("uElevation");
  const uIridescence = u("uIridescence");
  const uRefractStrength = u("uRefractStrength");
  const uTravelMode = u("uTravelMode");
  const uTexMargin = u("uTexMargin");
  const uTex = u("uTex");
  const uUseTexture = u("uUseTexture");
  const uTexOld = u("uTexOld");
  const uHasSnapshot = u("uHasSnapshot");
  const uProj = u("uProj");
  const uPalA = u("uPalA");
  const uPalB = u("uPalB");
  const uPalC = u("uPalC");
  const uPalD = u("uPalD");
  const DISTANCE = 3.4;
  const MARGIN = 0.7;
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
  let texOld: WebGLTexture | null = null;
  const ensureTexOld = () => {
    if (texOld) return texOld;
    texOld = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texOld);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texOld;
  };
  gl.uniform1f(uDistance, DISTANCE);
  gl.uniform1f(uTexMargin, MARGIN);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const state = {
    progress: 0,
    alpha: 0,
    palette: opts.palette ?? resolvePalette("prism"),
    anchor: opts.anchor ?? [0.5, 0.5],
    bulgeRadius: opts.bulgeRadius ?? 0.55,
    elevation: opts.elevation ?? 0.32,
    iridescence: opts.iridescence ?? 1,
    refractStrength: opts.refractStrength ?? 0.04,
    travelMode: opts.travelMode ?? 0,
    direction: opts.direction ?? "ltr",
    bandTight: opts.bandTight ?? 14,
    waveAmount: 1,
    rippleAmount: 1,
    waveSpeed: 1,
    brightness: 1,
    swellAmount: 1,
    textureSource: null as TexImageSource | null,
    useTexture: 0,
    snapshotSource: null as TexImageSource | null
  };
  const hueShift = Math.random() * 0.4;
  let ASPECT = 1;
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
    const proj = perspectiveProj2(fov, ASPECT, 0.1, 10);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(uProj, false, proj);
    gl.uniform1f(uAspect, ASPECT);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const start = performance.now();
  let raf = 0;
  let firstActiveFrameLogged = false;
  const tick = () => {
    const t = (performance.now() - start) / 1e3;
    if (!firstActiveFrameLogged && state.alpha > 1e-3) {
      firstActiveFrameLogged = true;
      console.log(
        "[glimm/namedrop] first active frame \u2014 alpha:",
        state.alpha.toFixed(3),
        "progress:",
        state.progress.toFixed(3),
        "useTexture:",
        state.useTexture,
        "textureSource:",
        state.textureSource ? "set" : "null"
      );
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uProgress, state.progress);
    gl.uniform1f(uAlpha, state.alpha);
    gl.uniform1f(uHueShift, hueShift);
    gl.uniform2f(uAnchor, state.anchor[0], state.anchor[1]);
    gl.uniform1f(uBulgeRadius, state.bulgeRadius);
    gl.uniform1f(uElevation, state.elevation);
    gl.uniform1f(uIridescence, state.iridescence);
    gl.uniform1f(uRefractStrength, state.refractStrength);
    gl.uniform1f(uTravelMode, state.travelMode);
    gl.uniform3f(uPalA, state.palette.a[0], state.palette.a[1], state.palette.a[2]);
    gl.uniform3f(uPalB, state.palette.b[0], state.palette.b[1], state.palette.b[2]);
    gl.uniform3f(uPalC, state.palette.c[0], state.palette.c[1], state.palette.c[2]);
    gl.uniform3f(uPalD, state.palette.d[0], state.palette.d[1], state.palette.d[2]);
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
    if (state.snapshotSource) {
      ensureTexOld();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texOld);
      try {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, state.snapshotSource);
      } catch {
      }
      gl.uniform1i(uTexOld, 1);
      gl.uniform1f(uHasSnapshot, 1);
    } else {
      gl.uniform1f(uHasSnapshot, 0);
    }
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
    setAnchor: (u2, v) => {
      state.anchor = [u2, v];
    },
    setBulgeRadius: (r) => {
      state.bulgeRadius = r;
    },
    setElevation: (z) => {
      state.elevation = z;
    },
    setIridescence: (i) => {
      state.iridescence = i;
    },
    setRefractStrength: (r) => {
      state.refractStrength = r;
    },
    setTravelMode: (on) => {
      state.travelMode = on;
    },
    setTextureSource: (src) => {
      state.textureSource = src;
    },
    setUseTexture: (on) => {
      state.useTexture = on;
    },
    setSnapshotSource: (src) => {
      state.snapshotSource = src;
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
      if (texOld) gl.deleteTexture(texOld);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    }
  };
}
