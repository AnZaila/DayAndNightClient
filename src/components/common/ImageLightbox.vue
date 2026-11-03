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
import { X } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    closeOnOutside?: boolean
  }>(),
  { closeOnOutside: true },
)

const { t } = useI18n()
const open = defineModel<boolean>('open', { required: true })

function onOutside(event: Event) {
  if (!props.closeOnOutside) event.preventDefault()
}
</script>

<template>
  <DialogRoot :open="open" @update:open="open = $event">
    <DialogPortal>
      <DialogOverlay class="overlay" :class="{ away: closeOnOutside }" />
      <DialogContent class="frame" @pointer-down-outside="onOutside">
        <DialogTitle class="sr-only">{{ t('dialog.viewImage') }}</DialogTitle>
        <DialogDescription class="sr-only">{{ alt || t('dialog.imageFallback') }}</DialogDescription>
        <img v-if="src" :src="src" :alt="alt" />
        <DialogClose as-child>
          <button v-wave type="button" class="close">
            <X :size="18" />
            {{ t('action.close') }}
          </button>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--scrim-strong);

  &.away {
    cursor: pointer;
  }
}

.frame {
  position: fixed;
  z-index: calc(var(--z-modal) + 1);
  top: 50%;
  left: 50%;
  width: max-content;
  max-width: calc(100% - var(--space-xl));
  background: transparent;
  transform: translate(-50%, -50%);
}

img {
  max-width: 100%;
  max-height: calc(100vh - 96px);
  object-fit: contain;
  border-radius: var(--radius);
  box-shadow: var(--shadow-hover);
}

.close {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  min-height: 40px;
  padding: 0 var(--space-sm);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--heading);
  box-shadow: var(--shadow-hover), inset 0 0 0 1px var(--line);
  cursor: pointer;
}
</style>
