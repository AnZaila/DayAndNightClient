<script setup lang="ts">
import { computed, ref } from 'vue'
import { ImagePlus } from '@lucide/vue'

defineProps<{
  accept?: string
  multiple?: boolean
}>()

const emit = defineEmits<{
  select: [files: File[]]
}>()

const input = ref<HTMLInputElement | null>(null)
const names = ref<string[]>([])
const summary = computed(() => {
  if (names.value.length === 0) return '还没有选择图片'
  if (names.value.length === 1) return names.value[0]
  return `已选 ${names.value.length} 张`
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
    <button type="button" class="btn quiet" @click="open">
      <ImagePlus :size="16" />
      选择图片
    </button>
    <p class="file-names">{{ summary }}</p>
  </div>
</template>

<style scoped lang="scss">
.file {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  max-width: 100%;
}
</style>
