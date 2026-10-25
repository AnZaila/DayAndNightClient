<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineOptions({ inheritAttrs: false })

defineProps<{
  to: RouteLocationRaw
}>()
</script>

<template>
  <RouterLink v-slot="{ href, navigate, isActive, isExactActive }" :to="to" custom>
    <a
      v-wave
      v-bind="$attrs"
      :href="href"
      :class="{ 'router-link-active': isActive }"
      :aria-current="isExactActive ? 'page' : undefined"
      @click="navigate"
    >
      <slot />
    </a>
  </RouterLink>
</template>
