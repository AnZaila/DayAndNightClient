<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'solid' | 'quiet'
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'solid', type: 'button', disabled: false },
)
</script>

<template>
  <button :type="type" :disabled="disabled" :class="['btn', variant]">
    <slot />
  </button>
</template>
