<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineOptions({ inheritAttrs: false })

defineProps<{
  to: RouteLocationRaw
}>()

function marked(href: string, isActive: boolean, isExactActive: boolean) {
  const path = href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
  const root = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'
  return path === '/' || path === root ? isExactActive : isActive
}
</script>

<template>
  <RouterLink v-slot="{ href, navigate, isActive, isExactActive }" :to="to" custom>
    <a
      v-wave
      v-bind="$attrs"
      :href="href"
      :class="{ 'router-link-active': marked(href, isActive, isExactActive) }"
      :aria-current="isExactActive ? 'page' : undefined"
      @click="navigate"
    >
      <slot />
    </a>
  </RouterLink>
</template>
