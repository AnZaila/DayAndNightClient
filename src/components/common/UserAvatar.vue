<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string | null
    size?: number
  }>(),
  {
    src: '',
    name: '',
    size: 36,
  },
)

const failed = ref(false)
const source = computed(() => (props.src || '').trim())
const showImage = computed(() => Boolean(source.value) && !failed.value)
const letter = computed(() => (props.name || '朝').trim().slice(0, 1) || '朝')
const fontSize = computed(() => Math.max(12, Math.round(props.size * 0.4)))

watch(source, () => {
  failed.value = false
})
</script>

<template>
  <span
    class="avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${fontSize}px` }"
  >
    <img v-if="showImage" :src="source" alt="" @error="failed = true" />
    <template v-else>{{ letter }}</template>
  </span>
</template>

<style scoped lang="scss">
.avatar {
  display: grid;
  flex: none;
  place-items: center;
  overflow: hidden;
  border-radius: 22%;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
  line-height: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
