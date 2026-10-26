<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string | null
    size?: number
    preview?: boolean
  }>(),
  {
    src: '',
    name: '',
    size: 36,
    preview: false,
  },
)

const failed = ref(false)
const viewOpen = ref(false)
const source = computed(() => (props.src || '').trim())
const showImage = computed(() => Boolean(source.value) && !failed.value)
const letter = computed(() => (props.name || '朝').trim().slice(0, 1) || '朝')
const fontSize = computed(() => Math.max(12, Math.round(props.size * 0.4)))
const alt = computed(() => (props.name || '头像').trim() || '头像')

watch(source, () => {
  failed.value = false
})

const canPreview = computed(() => props.preview && showImage.value)

function openView(event: Event) {
  if (!canPreview.value) return
  event.preventDefault()
  event.stopPropagation()
  viewOpen.value = true
}
</script>

<template>
  <span
    class="avatar"
    :class="{ view: canPreview }"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${fontSize}px` }"
    :role="canPreview ? 'button' : undefined"
    :tabindex="canPreview ? 0 : undefined"
    :aria-label="canPreview ? `查看${alt}` : undefined"
    @click="openView"
    @keydown.enter="openView"
  >
    <img v-if="showImage" :src="source" alt="" @error="failed = true" />
    <template v-else>{{ letter }}</template>
  </span>
  <ImageLightbox v-if="viewOpen" v-model:open="viewOpen" :src="source" :alt="alt" />
</template>

<style scoped lang="scss">
.avatar {
  display: grid;
  flex: none;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
  line-height: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.view {
    cursor: zoom-in;
  }
}
</style>
