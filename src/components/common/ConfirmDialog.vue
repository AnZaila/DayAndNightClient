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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/common/AppButton.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    tone?: 'primary' | 'success' | 'warning' | 'danger'
    closeOnOutside?: boolean
  }>(),
  {
    description: '',
    confirmLabel: '',
    cancelLabel: '',
    tone: 'primary',
    closeOnOutside: true,
  },
)

const { t } = useI18n()
const confirmText = computed(() => props.confirmLabel || t('action.confirm'))
const cancelText = computed(() => props.cancelLabel || t('action.keep'))

function onOutside(event: Event) {
  if (!props.closeOnOutside) event.preventDefault()
}

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
      <DialogOverlay class="overlay" :class="{ away: closeOnOutside }" />
      <DialogContent class="content" @pointer-down-outside="onOutside">
        <DialogTitle class="title">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="text">{{ description }}</DialogDescription>
        <DialogDescription v-else class="sr-only">{{ title }}</DialogDescription>
        <div class="actions">
          <DialogClose as-child>
            <AppButton variant="quiet">{{ cancelText }}</AppButton>
          </DialogClose>
          <AppButton :tone="tone" @click="confirm">{{ confirmText }}</AppButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--scrim);

  &.away {
    cursor: pointer;
  }
}

.content {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: calc(var(--z-modal) + 1);
  transform: translate(-50%, -50%);
  width: min(380px, calc(100% - 32px));
  padding: var(--space-lg);
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hover);
}

.title {
  margin: 0 0 var(--space-xs);
  color: var(--heading);
  font-size: 20px;
  font-weight: 600;
}

.text {
  margin: 0 0 var(--space-lg);
  color: var(--text);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
}
</style>
