<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ name?: string }>()
</script>

<template>
  <h1 class="brand">
    <RouterLink class="brand-link" :to="{ name: 'timeline' }">
      <img
        class="brand-mark"
        src="/logo/at-mark.png"
        alt=""
        width="232"
        height="124"
        decoding="async"
      />
      <span class="brand-name">{{ name || '安和甜' }}</span>
    </RouterLink>
  </h1>
</template>

<style scoped lang="scss">
.brand {
  flex: none;
  margin: 0;
  white-space: nowrap;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius);
  color: var(--heading);
  cursor: pointer;

  &:focus-visible {
    outline: none;
    box-shadow: var(--ring);
  }
}

.brand-mark {
  display: block;
  width: auto;
  height: 28px;
  transition:
    filter var(--dur-long) var(--ease-out),
    transform var(--dur-short) var(--ease-out);
}

[data-theme='dark'] .brand-mark {
  filter: invert(1);
}

.brand-name {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: var(--tracking-display);
}

.brand-link:hover .brand-name {
  color: var(--primary);
}

// 窄桌面放不下「标 + 站名」时先收掉站名，只留 AT 标。
@media (min-width: 981px) and (max-width: 1089px) {
  .brand-name {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-link:hover .brand-mark {
    transform: none;
  }
}
</style>
