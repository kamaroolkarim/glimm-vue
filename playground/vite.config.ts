import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const pkg = (p: string) => new URL(`../packages/glimm-vue/src/${p}`, import.meta.url).pathname

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^glimm-vue\/router$/, replacement: pkg('router.ts') },
      { find: /^glimm-vue\/vue$/, replacement: pkg('vue.ts') },
      { find: /^glimm-vue$/, replacement: pkg('index.ts') },
    ],
  },
})
