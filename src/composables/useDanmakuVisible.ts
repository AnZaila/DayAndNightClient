import { ref, watch } from 'vue'

const shown = ref(localStorage.getItem('dayandnight-danmaku') !== 'off')

watch(shown, (value) => {
  localStorage.setItem('dayandnight-danmaku', value ? 'on' : 'off')
})

export function useDanmakuVisible() {
  return { shown }
}
