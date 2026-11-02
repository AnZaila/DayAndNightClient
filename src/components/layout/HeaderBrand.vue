<script setup lang="ts">
defineProps<{ name?: string }>()
</script>

<template>
  <h1 class="brand">
    <img
      class="brand-mark"
      src="/logo/at-mark.png"
      alt=""
      width="232"
      height="124"
      decoding="async"
    />
    <span class="brand-name">{{ name || '安和甜' }}</span>
  </h1>
</template>

<style scoped lang="scss">
.brand {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 10px;
  color: var(--heading);
  white-space: nowrap;
}

.brand-mark {
  display: block;
  width: auto;
  height: 28px;
  transition: filter var(--dur-long) var(--ease-out);
}

[data-theme='dark'] .brand-mark {
  filter: invert(1);
}

.brand-name {
  font-family: var(--font-display);
  font-size: 20px;
}

// 窄桌面放不下「标 + 站名」时先收掉站名，只留 AT 标。
@media (min-width: 981px) and (max-width: 1089px) {
  .brand-name {
    display: none;
  }
}
</style>
