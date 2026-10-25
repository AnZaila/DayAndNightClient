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
  z-index: 80;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(360px, calc(100% - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--heading);
  color: var(--surface);
  box-shadow: var(--shadow-hover);
  text-align: center;
  font-size: 14px;

  &.error {
    background: var(--danger);
    color: #fff;
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
