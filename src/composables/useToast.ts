import { ref } from 'vue'

export type ToastKind = 'ok' | 'error'

export type ToastItem = {
  id: number
  text: string
  kind: ToastKind
}

const items = ref<ToastItem[]>([])
let seed = 0

export function useToasts() {
  return items
}

export function pushToast(text: string, kind: ToastKind = 'ok') {
  const id = ++seed
  items.value = [...items.value, { id, text, kind }]
  window.setTimeout(() => {
    items.value = items.value.filter((item) => item.id !== id)
  }, 2600)
}
