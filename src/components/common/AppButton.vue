<script setup lang="ts">
import Spinner from '@/components/common/Spinner.vue'

withDefaults(
  defineProps<{
    variant?: 'solid' | 'plain' | 'quiet'
    tone?: 'primary' | 'success' | 'warning' | 'danger'
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'solid', tone: 'primary', type: 'button', disabled: false, loading: false },
)
</script>

<template>
  <button
    v-wave
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="['btn', variant, variant === 'quiet' ? '' : tone]"
  >
    <Spinner v-if="loading" />
    <slot />
  </button>
</template>
