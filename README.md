# glimm-vue

> [!IMPORTANT]
> **This is an unofficial community port** — a Vue 3 fork of
> [`glimm`](https://www.npmjs.com/package/glimm) by Noman Ijaz. It is not
> affiliated with or endorsed by the original author. All credit for the
> shaders, palette math, and transition design goes to the original project;
> behavior is ported 1:1 from it. If you use React or Next.js, use the
> original [`glimm`](https://www.npmjs.com/package/glimm). Minor API
> translations: `<TransitionLink>` takes `to` instead of `href`, and
> `useTransitionRouter().refresh()` maps to `router.go(0)`.

WebGL **sweep transitions** for Vue 3. A colour band sweeps across the viewport,
your page swaps underneath it at the midpoint, then the band fades out — the iOS
"name drop" feel, as a page transition.

- **Framework-agnostic core** — drive the shader directly from vanilla JS.
- **Vue adapter** — `<GlimmProvider>` + `useGlimm()`.
- **vue-router adapter** — `<TransitionLink>`, `useTransitionRouter()`, auto link interception.
- Zero runtime dependencies. WebGL only — no CSS, no assets.
- Respects `prefers-reduced-motion` and degrades gracefully when WebGL is unavailable.

## Install

```bash
npm install glimm-vue
```

`vue` and `vue-router` are optional peer dependencies — install whichever adapter
you use. The core entry point needs neither.

## Quick start (Vue + vue-router)

```vue
<!-- App.vue -->
<script setup lang="ts">
import { GlimmProvider, InterceptLinks } from 'glimm-vue/router'
</script>

<template>
  <GlimmProvider palette="prism">
    <InterceptLinks />
    <RouterView />
  </GlimmProvider>
</template>
```

`<InterceptLinks />` runs every same-origin link click through a sweep. Opt a
link out with `data-glimm-skip`.

### Per-navigation control

```vue
<script setup lang="ts">
import { TransitionLink, useTransitionRouter } from 'glimm-vue/router'

// Declarative — a drop-in <RouterLink> replacement:
// <TransitionLink to="/about" :sweep="{ palette: 'berry', direction: 'rtl' }">About</TransitionLink>

// Programmatic — a drop-in useRouter():
const router = useTransitionRouter()
async function onSubmit() {
  await save(form)
  router.push('/dashboard', { palette: 'ember' })
}
</script>
```

## Vue (without vue-router)

```vue
<script setup lang="ts">
import { GlimmProvider, useGlimm } from 'glimm-vue/vue'

const { sweep } = useGlimm()
</script>

<template>
  <GlimmProvider>
    <button @click="sweep(() => doNavigation())">Go</button>
  </GlimmProvider>
</template>
```

`sweep(navigate, options?)` plays the band, awaits your `navigate` callback at
the midpoint, and returns a `{ midpoint, done, cancel }` handle.

## Vanilla / framework-agnostic core

```ts
import { createShader, playSweep } from 'glimm-vue'

const canvas = document.querySelector('canvas')!
const ctrl = createShader({ canvas, /* palette, bandTight, direction */ })

playSweep(ctrl, {
  palette: 'citrus',
  onMidpoint: () => swapPageContent(),
  onComplete: () => ctrl.destroy(),
})
```

Alternate looks: `createMeshShader` (vertex-displaced mesh) and
`createNamedropShader` (radial bulge reveal).

## Sweep options

| Option        | Default  | Notes |
| ------------- | -------- | ----- |
| `sweepMs`     | `1100`   | ms for the band to cross the viewport |
| `outroMs`     | `700`    | ms for the post-traversal fade-out |
| `midpoint`    | `0.56`   | 0–1 progress point where `onMidpoint` fires |
| `palette`     | `prism`  | preset name or a custom `Palette` |
| `direction`   | `ltr`    | `ltr` \| `rtl` \| `ttb` \| `btt` |
| `easing`      | `ease`   | preset name or an `(p) => number` fn |
| `bandTight`   | —        | band sharpness |
| `peakAlpha`   | `1`      | caps the band's peak opacity |
| `brightness`  | `1`      | 0–1.5, multiplies band RGB (dim it on dark backgrounds) |
| `waveAmount`  | `0`      | 0–2, opt-in edge displacement; 0 is straight |
| `rippleAmount`| `1`      | 0–2, vertical ripple texture |
| `waveSpeed`   | `1`      | 0–3, multiplies time-based motion |
| `swellAmount` | `0.55`   | 0–1, depth swell |
| `onMidpoint`  | —        | fires when the band reaches `midpoint` — swap pages here |
| `onComplete`  | —        | fires when the outro fade finishes |

**Built-in palettes:** `prism`, `berry`, `lagoon`, `citrus`, `azure`,
`ember`. Build your own with `accentPair`,
`accentChain`, or `shuffleAccentPalette`.

**Built-in easings:** `linear`, `easeOutQuart`, `easeOutCubic`, `easeInCubic`,
`easeInOutCubic`, `easeOutExpo`, `easeInOutQuint`, `snap`, `ease`, `back`.

## Entry points

| Import          | Use for |
| --------------- | ------- |
| `glimm-vue`     | Framework-agnostic core: shader factories, `playSweep`, palettes, easings, colour math. |
| `glimm-vue/vue` | `<GlimmProvider>` and `useGlimm()` for any Vue app. |
| `glimm-vue/router` | Everything in `glimm-vue/vue` plus `<TransitionLink>`, `useTransitionRouter()`, and `interceptLinks` / `<InterceptLinks>`. |

Import the provider and hooks from a **single** entry point per app so they
share one injection context.

## License

[MIT](./LICENSE) © Noman Ijaz (original glimm) and Kamarool Karim (Vue port).
Free to use, modify, and distribute.
