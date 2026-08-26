import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/vue.ts', 'src/router.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['vue', 'vue-router'],
})
