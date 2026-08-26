import { ref } from 'vue'

export type Theme = 'light' | 'dark'

export const theme = ref<Theme>('light')

export function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
