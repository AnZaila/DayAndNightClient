<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  { disabled: false },
)

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="switch">
    <span v-if="$slots.default"><slot /></span>
    <SwitchRoot v-model="model" class="switch-track" :disabled="disabled">
      <SwitchThumb class="switch-thumb" />
    </SwitchRoot>
  </label>
</template>
