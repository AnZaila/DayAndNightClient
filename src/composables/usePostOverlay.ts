import { shallowRef, type Component } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export const overlayBehind = shallowRef<{ view: Component; key: string } | null>(null)

export function rememberPostBackground(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  if (to.name === 'post' && from.name && from.name !== 'post') {
    const record = from.matched[from.matched.length - 1]
    const view = record?.components?.default
    if (view) overlayBehind.value = { view: view as Component, key: from.fullPath }
  } else if (to.name !== 'post') {
    overlayBehind.value = null
  }
}
