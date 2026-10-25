<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{
  visible: []
}>()

const node = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!node.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) emit('visible')
    },
    { rootMargin: '320px' },
  )
  observer.observe(node.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="node" class="sentinel" />
</template>

<style scoped lang="scss">
.sentinel {
  height: 1px;
}
</style>
