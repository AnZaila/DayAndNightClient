<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import AppButton from '@/components/common/AppButton.vue'

defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  confirm: []
}>()
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent class="content">
        <DialogTitle class="title">{{ title }}</DialogTitle>
        <DialogDescription class="sr-only">确认后会删掉，不能恢复。</DialogDescription>
        <div class="actions">
          <DialogClose as-child>
            <AppButton variant="quiet">留下</AppButton>
          </DialogClose>
          <AppButton @click="emit('confirm')">确认</AppButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgb(30 41 59 / 0.28);
}

.content {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 41;
  transform: translate(-50%, -50%);
  width: min(380px, calc(100% - 32px));
  padding: 24px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hover);
}

.title {
  margin: 0 0 20px;
  color: var(--heading);
  font-size: 20px;
  font-weight: 600;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
