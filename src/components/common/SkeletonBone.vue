<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
    circle?: boolean
    grow?: boolean
  }>(),
  {
    width: '100%',
    height: '14px',
    radius: '8px',
    circle: false,
    grow: false,
  },
)
</script>

<template>
  <span
    class="bone"
    :class="{ circle, grow }"
    :style="{ width, height: grow ? undefined : height, borderRadius: circle ? '999px' : radius }"
  />
</template>

<style scoped lang="scss">
.bone {
  display: block;
  flex: none;

  &.grow {
    flex: 1 1 auto;
    align-self: stretch;
    width: 100%;
    min-height: 100%;
  }
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--heading) 8%, var(--field)) 30%,
    color-mix(in srgb, var(--heading) 18%, var(--field)) 46%,
    color-mix(in srgb, var(--heading) 8%, var(--field)) 62%
  );
  background-size: 220% 100%;
  animation: shine 1.3s ease-in-out infinite;
}

@keyframes shine {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -40% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bone {
    animation: none;
  }
}
</style>
