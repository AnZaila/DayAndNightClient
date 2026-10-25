<script setup lang="ts">
import Spinner from '@/components/common/Spinner.vue'

withDefaults(
  defineProps<{
    variant?: 'solid' | 'quiet'
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'solid', type: 'button', disabled: false, loading: false },
)
</script>

<template>
  <button
    v-wave
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="['btn', variant]"
  >
    <Spinner v-if="loading" />
    <slot />
  </button>
</template>
