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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
defineProps<{
  options: { value: T; label: string }[]
  placeholder?: string
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger as-child>
      <button type="button" class="soft-trigger">
        <SelectValue :placeholder="placeholder ?? t('select.placeholder')" />
        <svg class="soft-chevron caret" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="soft-menu" position="popper" :side-offset="8">
        <SelectViewport>
          <SelectItem v-for="option in options" :key="option.value" as-child :value="option.value">
            <div class="soft-item">
              <SelectItemText>{{ option.label }}</SelectItemText>
            </div>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
