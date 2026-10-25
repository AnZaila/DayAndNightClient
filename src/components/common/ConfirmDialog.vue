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

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
  }>(),
  {
    description: '',
    confirmLabel: '确认',
    cancelLabel: '留下',
  },
)

const emit = defineEmits<{
  'update:open': [open: boolean]
  confirm: []
}>()

function confirm() {
  emit('confirm')
  emit('update:open', false)
}
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent class="content">
        <DialogTitle class="title">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="text">{{ description }}</DialogDescription>
        <DialogDescription v-else class="sr-only">{{ title }}</DialogDescription>
        <div class="actions">
          <DialogClose as-child>
            <AppButton variant="quiet">{{ cancelLabel }}</AppButton>
          </DialogClose>
          <AppButton @click="confirm">{{ confirmLabel }}</AppButton>
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
  margin: 0 0 8px;
  color: var(--heading);
  font-size: 20px;
  font-weight: 600;
}

.text {
  margin: 0 0 20px;
  color: var(--text);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
