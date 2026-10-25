<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <CheckboxRoot v-model="model" class="check">
    <span class="check-box">
      <CheckboxIndicator class="check-mark">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </CheckboxIndicator>
    </span>
    <span><slot /></span>
  </CheckboxRoot>
</template>
