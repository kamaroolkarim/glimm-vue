<script setup lang="ts">
const props = defineProps<{ id: string; title: string }>()
</script>

<template>
  <h2 class="glimm-section-title" :id="props.id">
    <a class="glimm-anchor" :href="'#' + props.id" :aria-label="'Anchor link for ' + props.title">{{ props.title }}</a>
  </h2>
</template>

<style scoped>
.glimm-section-title {
  font-family: Inter, sans-serif;
  font-size: 15px;
  line-height: 23px;
  letter-spacing: -0.1px;
  color: #242529;
  text-wrap: pretty;
  font-weight: 500;
  position: relative;
  scroll-margin-top: 32px;
  margin: 0;
}

.glimm-anchor {
  color: inherit;
  text-decoration: none;
  position: relative;
}

.glimm-anchor::before {
  content: '#';
  position: absolute;
  left: -20px;
  top: 0;
  color: #9ca3af;
  opacity: 0;
  transition: opacity 150ms ease;
  pointer-events: none;
}

.glimm-section-title:hover .glimm-anchor::before {
  opacity: 1;
}
</style>
