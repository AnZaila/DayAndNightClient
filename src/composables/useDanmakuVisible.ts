import { ref } from 'vue'

const shown = ref(localStorage.getItem('dayandnight-danmaku') !== 'off')

export function useDanmakuVisible() {
  function toggle() {
    shown.value = !shown.value
    localStorage.setItem('dayandnight-danmaku', shown.value ? 'on' : 'off')
  }

  return { shown, toggle }
}
