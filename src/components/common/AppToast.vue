<script setup lang="ts">
import { useToasts } from '@/composables/useToast'

const items = useToasts()
</script>

<template>
  <div class="toasts">
    <TransitionGroup name="toast">
      <p v-for="item in items" :key="item.id" class="toast" :class="item.kind">{{ item.text }}</p>
    </TransitionGroup>
  </div>
</template>

<style lang="scss">
.toasts {
  position: fixed;
  top: 64px;
  left: 50%;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: min(360px, calc(100% - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  --toast: var(--color-success);
  margin: 0;
  padding: 10px var(--space-sm);
  border: 0;
  border-radius: 10px;
  background: color-mix(in oklab, var(--toast) 14%, var(--surface));
  box-shadow: var(--shadow);
  color: color-mix(in oklab, var(--toast) 68%, var(--heading));
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.5;
  text-align: center;

  &.error {
    --toast: var(--color-error);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
