<script setup lang="ts">
const petals = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: (index * 7.3 + 4) % 100,
  delay: (index * 1.7) % 12,
  duration: 13 + ((index * 3) % 9),
  size: 9 + ((index * 5) % 8),
  drift: index % 2 === 0 ? 1 : -1,
  opacity: 0.5 + ((index * 7) % 4) / 8,
}))
</script>

<template>
  <div class="petals" aria-hidden="true">
    <span
      v-for="petal in petals"
      :key="petal.id"
      class="petal"
      :style="{
        left: `${petal.left}%`,
        animationDelay: `-${petal.delay}s`,
        animationDuration: `${petal.duration}s`,
        width: `${petal.size}px`,
        height: `${petal.size * 0.7}px`,
        opacity: petal.opacity,
        '--drift': petal.drift,
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.petals {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.petal {
  position: absolute;
  top: -10%;
  border-radius: 60% 40% 55% 45% / 55% 45% 60% 40%;
  background: rgb(255 226 238 / 95%);
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes fall {
  0% {
    top: -10%;
    translate: 0 0;
    rotate: 0deg;
  }

  50% {
    translate: calc(-1 * var(--drift) * 26px) 0;
    rotate: 150deg;
  }

  100% {
    top: 108%;
    translate: calc(var(--drift) * 52px) 0;
    rotate: 320deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .petal {
    display: none;
    animation: none;
  }
}
</style>
