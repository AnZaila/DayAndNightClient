import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const theme = ref<Theme>(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

export function useTheme() {
  function setTheme(next: Theme) {
    theme.value = next
    document.documentElement.dataset.theme = next
    localStorage.setItem('dayandnight-theme', next)
  }

  function toggle() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggle }
}
