<script setup lang="ts" generic="T extends string">
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

defineProps<{
  options: { value: T; label: string }[]
  placeholder?: string
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger class="soft-trigger">
      <SelectValue :placeholder="placeholder ?? '请选择'" />
      <svg class="soft-chevron" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="soft-menu" position="popper" :side-offset="8">
        <SelectViewport>
          <SelectItem v-for="option in options" :key="option.value" class="soft-item" :value="option.value">
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
