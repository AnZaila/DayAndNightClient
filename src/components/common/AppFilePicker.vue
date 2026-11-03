<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ImagePlus } from '@lucide/vue'

const props = defineProps<{
  accept?: string
  multiple?: boolean
  label?: string
  hideNames?: boolean
}>()
const { t } = useI18n()

const emit = defineEmits<{
  select: [files: File[]]
}>()

const input = ref<HTMLInputElement | null>(null)
const names = ref<string[]>([])
const summary = computed(() => {
  if (names.value.length === 0) return t('file.none')
  if (names.value.length === 1) return names.value[0]
  return t('file.picked', { n: names.value.length })
})

function open() {
  input.value?.click()
}

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files ? Array.from(target.files) : []
  names.value = files.map((file) => file.name)
  emit('select', files)
}
</script>

<template>
  <div class="file">
    <input
      ref="input"
      class="sr-only"
      type="file"
      :accept="accept"
      :multiple="multiple"
      tabindex="-1"
      @change="onChange"
    />
    <button v-wave type="button" class="btn quiet" @click="open">
      <ImagePlus :size="16" />
      {{ props.label || t('file.pick') }}
    </button>
    <p v-if="!hideNames" class="file-names">{{ summary }}</p>
  </div>
</template>

<style scoped lang="scss">
.file {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  max-width: 100%;
}
</style>
