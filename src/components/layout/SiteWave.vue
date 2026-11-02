<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSiteStore } from '@/stores/site'

const { site } = storeToRefs(useSiteStore())
</script>

<template>
  <footer class="foot" aria-hidden="true">
    <svg class="waves" viewBox="0 24 150 28" preserveAspectRatio="none">
      <defs>
        <path
          id="wave"
          d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"
        />
      </defs>
      <g class="parallax">
        <use href="#wave" x="48" y="0" />
        <use href="#wave" x="48" y="3" />
        <use href="#wave" x="48" y="5" />
        <use href="#wave" x="48" y="7" />
      </g>
    </svg>
    <p v-if="site" class="mark">{{ site.title }} · {{ site.subtitle }}</p>
  </footer>
</template>

<style scoped lang="scss">
.foot {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  color: var(--on-primary);
}

.waves {
  display: block;
  width: 100%;
  height: 96px;
  overflow: hidden;
}

.parallax use {
  animation: drift 25s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
}

.parallax use:nth-child(1) {
  fill: color-mix(in oklab, var(--primary) 22%, var(--bg));
  animation-duration: 7s;
  animation-delay: -2s;
}

.parallax use:nth-child(2) {
  fill: color-mix(in oklab, var(--primary) 38%, var(--bg));
  animation-duration: 10s;
  animation-delay: -3s;
}

.parallax use:nth-child(3) {
  fill: color-mix(in oklab, var(--primary) 58%, var(--bg));
  animation-duration: 13s;
  animation-delay: -4s;
}

.parallax use:nth-child(4) {
  fill: var(--primary);
  animation-duration: 20s;
  animation-delay: -5s;
}

.mark {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 0;
  padding: 0 var(--space-md) var(--space-sm);
  text-align: center;
  font-family: var(--font-display);
  font-size: var(--text-sm);
}

@keyframes drift {
  0% {
    transform: translateX(-90px);
  }

  100% {
    transform: translateX(85px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .parallax use {
    animation: none;
  }
}
</style>
