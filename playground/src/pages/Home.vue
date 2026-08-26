<script setup lang="ts">
import { ref } from 'vue'
import type { PaletteName } from 'glimm-vue'
import { useGlimm, TransitionLink } from 'glimm-vue/router'
import Wordmark from '../components/Wordmark.vue'
import DemoBox from '../components/DemoBox.vue'
import CommandRow from '../components/CommandRow.vue'
import CopyButton from '../components/CopyButton.vue'
import CodeBlock from '../components/CodeBlock.vue'
import SectionTitle from '../components/SectionTitle.vue'
import EasingPicker from '../components/EasingPicker.vue'
import BandWidthBox from '../components/BandWidthBox.vue'
import CustomPaletteDemo from '../components/CustomPaletteDemo.vue'
import { PALETTE_VISUALS } from '../components/palettes'

const { sweep } = useGlimm()

const AGENT_PROMPT = `Add glimm-vue to my Vue app.

1. Install it:  npm install glimm-vue
2. In my App.vue, import { GlimmProvider, InterceptLinks } from 'glimm-vue/router', wrap the app in <GlimmProvider palette="prism">, and render <InterceptLinks /> just inside it:

   <GlimmProvider palette="prism">
     <InterceptLinks />
     <RouterView />
   </GlimmProvider>

Keep the rest of my setup unchanged.`

const QUICK_START = `// App.vue
<script setup>
import { GlimmProvider, InterceptLinks } from 'glimm-vue/router'
<\/script>

<template>
  <GlimmProvider palette="prism">
    <InterceptLinks />
    <RouterView />
  </GlimmProvider>
</template>
`

const TRIGGER_TABS = [
  {
    label: '<TransitionLink>',
    code: `import { TransitionLink } from 'glimm-vue/router'

<TransitionLink to="/about" :sweep="{ palette: 'berry' }">
  About
</TransitionLink>
`
  },
  {
    label: 'useTransitionRouter()',
    code: `const router = useTransitionRouter()

async function onSubmit() {
  await save(form)
  router.push('/dashboard', { palette: 'ember' })
}
`
  },
  {
    label: '<InterceptLinks />',
    code: `import { GlimmProvider, InterceptLinks } from 'glimm-vue/router'

<GlimmProvider palette="prism">
  <InterceptLinks />
  <RouterView />
</GlimmProvider>

<a href="/pricing" data-glimm-skip>Pricing</a>
`
  }
]

const tab = ref(0)

const DEMOS = [
  { to: '/demos/publish', label: 'Demo 1' },
  { to: '/demos/autopilot', label: 'Demo 2' },
  { to: '/demos/theme', label: 'Demo 3' },
  { to: '/demos/tasks', label: 'Demo 4' }
]

function previewPalette(name: PaletteName) {
  void sweep(() => {}, { palette: name })
}

type BPItem = { lead: string; before: string; code?: string; after?: string }

const USE_FOR: BPItem[] = [
  { lead: '', before: 'Moments like publishing, submitting or completing where the action deserves a celebration.' },
  { lead: 'Confirmed actions:', before: 'a brief pause can help users notice the new state.' },
  { lead: 'Focused modes:', before: 'use it during checkout, presentations, or review screens where previous context has been replaced with new information.' },
  { lead: 'Section-level navigation:', before: 'apply it for navigation that is clearly different, not for every page change in the same area.' }
]

const AVOID_FOR: BPItem[] = [
  {
    lead: 'Every internal navigation:',
    before: 'although ',
    code: '<InterceptLinks />',
    after: ' makes it easy to use everywhere, sweeping the screen with every click reduces its impact.'
  },
  { lead: 'Passive interactions:', before: 'includes hover effects, focus, tooltips, dropdowns, and menus.' },
  { lead: 'Repeated actions in a loop:', before: 'example includes adding rows, checking off items, or moving through a list.' },
  { lead: 'Loading or skeleton states:', before: 'glimm is meant for punctuation, not for spinning indicators.' }
]

const PROPS: [string, string, string, string][] = [
  ['palette', 'PaletteName | Palette', "'prism'", '6 presets or BYO {a,b,c,d}.'],
  ['direction', "'ltr' | 'rtl' | 'ttb' | 'btt'", "'ltr'", 'Sweep axis + side.'],
  ['easing', 'EasingName | (p) => number', "'ease'", '10 built-ins or custom curve.'],
  ['sweepMs', 'number', '1100', 'Band traversal duration.'],
  ['outroMs', 'number', '700', 'Post-traversal alpha fade.'],
  ['midpoint', 'number', '0.56', 'When routes swap mid-sweep.'],
  ['peakAlpha', 'number', '1', 'Caps band peak (0..1.5).'],
  ['brightness', 'number', '1', 'RGB scale; ~0.85 on dark.'],
  ['bandTight', 'number', '14', 'Tightness; lower = wider.'],
  ['waveAmount', 'number', '0', 'Optional edge displacement.'],
  ['rippleAmount', 'number', '1', 'Vertical ripple texture.'],
  ['waveSpeed', 'number', '1', 'Shader animation speed.']
]
</script>

<template>
  <div class="glimm-page">
    <Wordmark />
    <div class="page-shell">
      <div class="header-fade"></div>
      <div class="glimm-landing-main">
        <div class="glimm-landing-shell">
          <div class="content-col">
            <div class="content">
              <div class="port-alert">
                <p class="alert-title">Important — unofficial community port</p>
                <p class="alert-body">
                  glimm-vue is a Vue 3 fork of
                  <a href="https://www.npmjs.com/package/glimm" target="_blank" rel="noreferrer">glimm</a>
                  by Noman Ijaz — not affiliated with or endorsed by the original author. All credit for the shaders,
                  palette math, and transition design goes to the original project; behavior is ported 1:1.
                  If you use React or Next.js, use the original
                  <a href="https://www.npmjs.com/package/glimm" target="_blank" rel="noreferrer">glimm</a>.
                </p>
              </div>
              <div class="glimm-blueprint">
                <img class="glimm-blueprint-img" src="/shader-diagram-v2.png" draggable="false" alt="" />
              </div>

              <div class="hero">
                <h1 id="glimm" class="glimm-hero-title">glimm</h1>
                <p class="body-p">
                  glimm-vue is a Vue 3 library for delightful shader-driven page transitions. It sweeps a single WebGL
                  band across your screen during route changes or any state change you select. The new view appears
                  underneath as the band moves. It is GPU-composited, under 10 KB, and has zero performance impact.
                </p>
                <div class="hero-install">
                  <CommandRow command="npm install glimm-vue" />
                  <p class="peer-note">Zero runtime dependencies. Vue 3.3+ and vue-router 4.2+ are peer deps.</p>
                </div>
              </div>

              <section class="glimm-section first">
                <div>
                  <div class="demo-margin">
                    <DemoBox />
                  </div>
                </div>
              </section>

              <section id="demos" class="glimm-section">
                <div>
                  <SectionTitle id="demos" title="Demos" />
                </div>
                <div class="section-body">
                  <ul class="glimm-dim-list">
                    <li v-for="(demo, i) in DEMOS" :key="demo.to" :class="{ first: i === 0 }">
                      <TransitionLink :to="demo.to" class="demo-row">
                        <span class="glimm-tabular">{{ demo.label }}</span>
                        <span class="demo-eye">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-eye-filled" style="display: block; flex-shrink: 0"><path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" /></svg>
                        </span>
                      </TransitionLink>
                    </li>
                  </ul>
                </div>
              </section>

              <section id="installation" class="glimm-section">
                <div>
                  <SectionTitle id="installation" title="Installation" />
                  <p class="body-p intro">
                    You can install glimm-vue using npm, or share the following prompt with a coding agent to set it up
                    for you.
                  </p>
                </div>
                <div class="section-body">
                  <div class="install-col">
                    <CommandRow command="npm install glimm-vue" />
                    <div class="agent-card">
                      <div class="agent-head">
                        <span class="agent-label">Tell your coding agent</span>
                        <CopyButton :code="AGENT_PROMPT" :size="16" />
                      </div>
                      <p class="agent-body">{{ AGENT_PROMPT }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section id="quick-start" class="glimm-section">
                <div>
                  <SectionTitle id="quick-start" title="Quick start" />
                  <p class="body-p intro">
                    Getting started takes a single step. Wrap your app in <code class="ic">GlimmProvider</code> so glimm
                    is available on every route. From there, you choose how a transition gets triggered using one of the
                    <a class="text-link" href="#triggers">options</a> below. The provider stays idle until it's actually
                    needed: it builds its one WebGL context on the very first sweep, so an app that never transitions
                    costs nothing to set up.
                  </p>
                </div>
                <div class="section-body">
                  <CodeBlock label="App.vue" :code="QUICK_START" />
                </div>
              </section>

              <section id="triggers" class="glimm-section">
                <div>
                  <SectionTitle id="triggers" title="Triggers" />
                  <p class="body-p intro">
                    There are three ways to trigger a transition, and you can use any combination across your app.
                    <code class="ic">TransitionLink</code> replaces standard links when the destination is known
                    upfront. <code class="ic">useTransitionRouter()</code> handles programmatic navigation, like
                    redirects after form submissions. Or drop in <code class="ic">&lt;InterceptLinks /&gt;</code> at
                    the root level to automatically apply transitions to all internal links without touching existing
                    code.
                  </p>
                </div>
                <div class="section-body">
                  <div class="tab-bar" role="tablist">
                    <button
                      v-for="(t, i) in TRIGGER_TABS"
                      :key="t.label"
                      type="button"
                      role="tab"
                      :aria-selected="tab === i"
                      class="tab"
                      :class="{ active: tab === i }"
                      @click="tab = i"
                    >
                      {{ t.label }}
                    </button>
                  </div>
                  <CodeBlock :key="tab" :label="TRIGGER_TABS[tab].label" :code="TRIGGER_TABS[tab].code" :min-height="240" />
                </div>
              </section>

              <section id="presets" class="glimm-section">
                <div>
                  <SectionTitle id="presets" title="Presets" />
                  <p class="body-p intro">
                    glimm-vue includes 6 built-in color palettes, each tuned to a different mood using cosine
                    gradients. Pass any palette name as a string to the <code class="ic">palette</code> option. If the
                    presets don't fit your design, you can create a custom palette using the
                    <code class="ic">{a,b,c,d}</code> format, covered in Custom palette below.
                  </p>
                </div>
                <div class="section-body">
                  <div>
                    <div
                      v-for="(p, i) in PALETTE_VISUALS"
                      :key="p.name"
                      class="preset-row"
                      :class="{ first: i === 0 }"
                      @click="previewPalette(p.name)"
                    >
                      <span class="preset-name">{{ p.name }}</span>
                      <span class="preset-band" :style="{ background: p.gradient }"></span>
                      <span class="preset-action">
                        <button
                          type="button"
                          class="ghost-eye"
                          aria-label="Preview"
                          @click.stop="previewPalette(p.name)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-eye-filled" style="display: block; flex-shrink: 0"><path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" /></svg>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section id="easing" class="glimm-section">
                <div>
                  <SectionTitle id="easing" title="Easing" />
                  <p class="body-p intro">
                    Easing controls how the band speeds up and slows down as it crosses the screen. Front-loaded curves
                    like <code class="ic">back</code> and <code class="ic">easeOutQuart</code> start fast, so the sweep
                    feels snappy and immediate. Symmetric curves like <code class="ic">easeInOutCubic</code> ease in
                    and out evenly, for a calmer, more composed feel. Pass any of the 10 built-in curves as a string,
                    or provide your own as a <code class="ic">(p: number) =&gt; number</code> function.
                  </p>
                </div>
                <div class="section-body">
                  <EasingPicker />
                </div>
              </section>

              <section id="band-width" class="glimm-section">
                <div>
                  <SectionTitle id="band-width" title="Band width" />
                  <p class="body-p intro">
                    <code class="ic">bandTight</code> controls how concentrated the band's gaussian falloff is. Lower
                    values produce a wider, softer band; higher values make a narrower, more focused beam.
                  </p>
                </div>
                <div class="section-body">
                  <BandWidthBox />
                </div>
              </section>

              <section id="custom-palette" class="glimm-section">
                <div>
                  <SectionTitle id="custom-palette" title="Custom palette" />
                  <p class="body-p intro">
                    Each palette is a cosine palette:
                    <code class="ic">color(t) = a + b·cos(2π·(c·t + d))</code>. Each of
                    <code class="ic">a</code>, <code class="ic">b</code>, <code class="ic">c</code>,
                    <code class="ic">d</code> is an RGB triplet — hit Shuffle to roll one, then copy the snippet below.
                  </p>
                </div>
                <div class="section-body">
                  <CustomPaletteDemo />
                </div>
              </section>

              <section id="props" class="glimm-section">
                <div>
                  <SectionTitle id="props" title="Props" />
                  <p class="body-p intro">
                    Everything you can pass to <code class="ic">GlimmProvider</code> (as defaults) or any trigger (as
                    per-call overrides). Every option is optional.
                  </p>
                </div>
                <div class="section-body">
                  <div class="table-scroll">
                    <table class="props-table">
                      <colgroup>
                        <col style="width: 17%" />
                        <col style="width: 33%" />
                        <col style="width: 18%" />
                        <col style="width: 32%" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Prop</th>
                          <th>Type</th>
                          <th>Default</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="row in PROPS" :key="row[0]">
                          <td class="td-name">
                            <span class="prop-name">{{ row[0] }}</span>
                          </td>
                          <td class="td-type">
                            <span class="prop-type">{{ row[1] }}</span>
                          </td>
                          <td class="td-type">
                            <span class="prop-type">{{ row[2] }}</span>
                          </td>
                          <td class="td-desc">{{ row[3] }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section id="best-practices" class="glimm-section">
                <div>
                  <SectionTitle id="best-practices" title="Best practices" />
                  <p class="body-p intro">
                    glimm-vue is recommended for highlighting moments rather than just motion. Each sweep serves as a
                    form of punctuation, reserved for state changes that require attention while allowing the rest of
                    the app to remain quiet.
                  </p>
                </div>
                <div class="section-body">
                  <div class="bp-col">
                    <div>
                      <p class="bp-heading">Use glimm for:</p>
                      <ul class="bp-list">
                        <li v-for="item in USE_FOR" :key="item.before">
                          <span class="bp-bullet" aria-hidden="true">•</span>
                          <span v-if="item.lead" class="bp-lead">{{ item.lead }}</span>
                          {{ item.before }}
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p class="bp-heading">Avoid using glimm for:</p>
                      <ul class="bp-list">
                        <li v-for="item in AVOID_FOR" :key="item.lead">
                          <span class="bp-bullet" aria-hidden="true">•</span>
                          <span v-if="item.lead" class="bp-lead">{{ item.lead }}</span>
                          {{ ' ' }}{{ item.before }}<template v-if="item.code"><code class="ic">{{ item.code }}</code>{{ item.after }}</template>
                        </li>
                      </ul>
                    </div>
                    <p class="body-p bp-closing">
                      To determine if a moment needs a glimm sweep, consider whether you would mention it in a
                      changelog or launch post. If yes, then glimm is likely a good fit. If it's just “the user clicked
                      something,” skip it. Using glimm sparingly makes the moments it does highlight more meaningful.
                    </p>
                  </div>
                </div>
              </section>

              <footer class="glimm-footer">
                <span class="footer-version">v0.1.0 · MIT licensed</span>
                <span class="footer-made">
                  Made by <span class="footer-name">Kamarool Karim</span> · a Vue port of glimm by Noman
                </span>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
body:has(.glimm-page) {
  background: #fff;
}

body:has(.glimm-page) .nav {
  display: none;
}

body:has(.glimm-page) .page {
  max-width: none;
  margin: 0;
  padding: 0;
}

body:has(.glimm-page) .shell {
  background: #fff;
  min-height: 0;
}
</style>

<style scoped>
.glimm-page {
  font-family: Inter, sans-serif;
  background: #fff;
  color: #242529;
}

.page-shell {
  position: relative;
}

.header-fade {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 124px;
  z-index: 40;
  pointer-events: none;
  background: linear-gradient(to bottom, #fff 0%, #fff 30%, rgba(255, 255, 255, 0) 100%);
}

.glimm-landing-main {
  background: #fff;
  min-height: 100vh;
  padding-top: 192px;
  padding-bottom: 89px;
  padding-left: 48px;
  padding-right: 48px;
}

.glimm-landing-shell {
  padding-left: 32px;
  padding-right: 32px;
}

.content-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content {
  width: 100%;
  max-width: 634px;
}

.port-alert {
  background: rgba(97, 85, 245, 0.05);
  border: 0.5px solid rgba(97, 85, 245, 0.35);
  border-left: 3px solid rgb(97, 85, 245);
  border-radius: 10px;
  padding: 13px 16px;
  margin-bottom: 28px;
}

.port-alert p {
  margin: 0;
  font-size: 15px;
  line-height: 23px;
  letter-spacing: -0.1px;
  color: #525252;
}

.port-alert .alert-title {
  font-weight: 550;
  color: #242529;
  margin-bottom: 4px;
}

.port-alert a {
  color: rgb(97, 85, 245);
  font-weight: 500;
  text-decoration-color: rgba(97, 85, 245, 0.3);
  text-underline-offset: 2px;
}

.glimm-blueprint {
  position: relative;
  width: 100%;
  max-width: 634px;
  aspect-ratio: 1980 / 1114;
  margin: 8px auto 80px;
  border-radius: 12px;
  overflow: hidden;
  z-index: 42;
}

.glimm-blueprint-img {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: none;
}

.hero {
  margin-top: 34px;
}

.glimm-hero-title {
  font-family: Inter, sans-serif;
  font-size: 17px;
  line-height: 24px;
  letter-spacing: -0.26px;
  color: #242529;
  text-wrap: pretty;
  font-weight: 500;
  margin: 0 0 5px;
  scroll-margin-top: 110px;
}

.body-p {
  font-family: Inter, sans-serif;
  font-size: 15px;
  line-height: 23px;
  letter-spacing: -0.1px;
  color: #525252;
  text-wrap: pretty;
  font-weight: 400;
  margin: 0;
}

.intro {
  margin-top: 5px;
}

.ic {
  font-family: var(--font-geist-mono), 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 20px;
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 3px;
}

.text-link {
  color: #242529;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 150ms ease;
}

.text-link:hover {
  opacity: 0.7;
}

.hero-install {
  margin-top: 21px;
}

.peer-note {
  font-family: Inter, sans-serif;
  font-size: 13px;
  line-height: 18px;
  font-weight: 400;
  letter-spacing: -0.18px;
  text-wrap: pretty;
  margin-top: 8px;
  color: #9ca3af;
}

.glimm-section {
  scroll-margin-top: 110px;
  margin-top: 96px;
}

.glimm-section.first {
  margin-top: 0;
}

.section-body {
  margin-top: 24px;
}

.demo-margin {
  margin-top: 34px;
}

.glimm-dim-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.glimm-dim-list li {
  border-top: 0.5px solid #ececec;
  list-style: none;
}

.glimm-dim-list li.first {
  border-top: none;
}

.demo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  min-height: 48px;
  padding: 12px 0;
}

.glimm-tabular {
  font-family: Inter, sans-serif;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
  letter-spacing: -0.1px;
  text-wrap: pretty;
  color: #242529;
}

.demo-eye {
  color: #bfbfbf;
  display: inline-flex;
  align-items: center;
  transition: color 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.demo-row:hover .demo-eye {
  color: #242529;
}

.install-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.agent-card {
  border-radius: 12px;
  overflow: hidden;
  background: #f7f7f7;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.04);
}

.agent-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  border-bottom: 1px solid #ececec;
}

.agent-label {
  font-family: Inter, sans-serif;
  font-size: 13px;
  line-height: 18px;
  font-weight: 550;
  letter-spacing: -0.18px;
  text-wrap: pretty;
  color: #525252;
}

.agent-body {
  margin: 0;
  padding: 12px 14px;
  white-space: pre-wrap;
  color: #4b5563;
  font-size: 13px;
  line-height: 21px;
  font-family: Inter, sans-serif;
}

.tab-bar {
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 999px;
  background: #f7f7f7;
  margin-bottom: 12px;
  position: relative;
  max-width: 100%;
  overflow-x: auto;
}

.tab {
  position: relative;
  height: 28px;
  padding: 0 14px;
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: var(--font-geist-mono), 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 550;
  letter-spacing: -0.06px;
  line-height: 1;
  white-space: nowrap;
  color: #9ca3af;
  transition: color 180ms ease;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: 999px;
}

.tab.active {
  color: #242529;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.preset-row {
  width: 100%;
  display: grid;
  grid-template-columns: 90px 1fr 90px;
  align-items: center;
  gap: 13px;
  padding: 8px 0;
  border-top: 1px solid #ececec;
  cursor: pointer;
  text-align: left;
  opacity: 1;
  transition: opacity 160ms ease;
}

.preset-row.first {
  border-top: none;
}

.preset-name {
  font-family: Inter, sans-serif;
  font-size: 13px;
  line-height: 18px;
  font-weight: 400;
  letter-spacing: -0.18px;
  text-wrap: pretty;
  color: #242529;
  font-variation-settings: 'wght' 400;
}

.preset-band {
  height: 14px;
  border-radius: 999px;
}

.preset-action {
  justify-self: end;
  display: inline-flex;
}

.ghost-eye {
  font-family: Inter, sans-serif;
  font-size: 11px;
  line-height: 18px;
  font-weight: 550;
  letter-spacing: -0.1px;
  text-wrap: pretty;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 6px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background: transparent;
  color: #bfbfbf;
  flex-shrink: 0;
  transition:
    background-color 160ms cubic-bezier(0.23, 1, 0.32, 1),
    color 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.ghost-eye:hover {
  color: #242529;
}

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.props-table {
  width: 100%;
  min-width: 520px;
  text-align: left;
  border-collapse: collapse;
  table-layout: fixed;
  font-family: 'Inter', sans-serif;
}

.props-table th {
  font-size: 11px;
  color: #9ca3af;
  letter-spacing: -0.08px;
  font-weight: 500;
  padding: 9px 10px;
  border-bottom: 1px solid #ececec;
  font-family: 'Inter', sans-serif;
}

.props-table tbody tr {
  border-bottom: 1px solid #ececec;
}

.td-name {
  padding: 7px 10px;
  vertical-align: top;
}

.prop-name {
  font-size: 12px;
  color: #242529;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  font-variant-numeric: tabular-nums;
}

.td-type {
  padding: 7px 10px;
  vertical-align: top;
  word-break: break-word;
}

.prop-type {
  font-size: 11px;
  color: #858585;
  font-family: 'Inter', sans-serif;
  font-variant-numeric: tabular-nums;
}

.td-desc {
  padding: 7px 10px;
  vertical-align: top;
  font-size: 12px;
  color: #858585;
  line-height: 1.5;
  letter-spacing: -0.08px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  text-wrap: pretty;
}

.bp-col {
  display: flex;
  flex-direction: column;
  gap: 21px;
}

.bp-heading {
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 23px;
  letter-spacing: -0.1px;
  color: #242529;
  text-wrap: pretty;
  font-weight: 550;
  font-variation-settings: 'wght' 550;
  margin: 0;
  margin-bottom: 10px;
}

.bp-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.bp-list li {
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 23px;
  letter-spacing: -0.1px;
  color: #525252;
  text-wrap: pretty;
  font-weight: 400;
  position: relative;
  padding-left: 22px;
}

.bp-bullet {
  position: absolute;
  left: 6px;
  top: 0;
  color: #525252;
  line-height: 23px;
}

.bp-lead {
  color: #242529;
}

.bp-closing {
  margin: 0;
}

.glimm-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: max-content;
  font-family: Inter, sans-serif;
  font-weight: 450;
  font-variation-settings: 'wght' 450;
  color: #9ca3af;
  letter-spacing: -0.01em;
}

.footer-version {
  font-size: 13px;
  line-height: 18px;
}

.footer-made {
  font-size: 12px;
  line-height: 18px;
  margin-top: 2px;
}

.footer-name {
  color: #242529;
  font-weight: 500;
}

@media (max-width: 640px) {
  .glimm-landing-main {
    padding-left: 24px;
    padding-right: 24px;
  }

  .glimm-landing-shell {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
