<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { X } from '@lucide/vue'

defineProps<{
  src: string
  alt: string
}>()

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <DialogRoot :open="open" @update:open="open = $event">
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent class="frame">
        <DialogTitle class="sr-only">查看图片</DialogTitle>
        <DialogDescription class="sr-only">{{ alt || '帖子里的图片' }}</DialogDescription>
        <img v-if="src" :src="src" :alt="alt" />
        <DialogClose class="btn quiet close" aria-label="关闭">
          <X :size="16" />
          关闭
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgb(15 20 28 / 0.72);
}

.frame {
  position: fixed;
  inset: 16px;
  z-index: 41;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: transparent;
}

img {
  max-width: min(1100px, 100%);
  max-height: calc(100vh - 120px);
  object-fit: contain;
  border-radius: var(--radius);
  box-shadow: var(--shadow-hover);
}

.close {
  background: var(--surface);
}
</style>
