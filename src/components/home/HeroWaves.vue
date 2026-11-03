<template>
  <svg
    class="waves"
    viewBox="0 24 150 28"
    width="150"
    height="28"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <path
        id="heroWave"
        d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"
      />
    </defs>
    <g class="parallax">
      <use href="#heroWave" x="48" y="2" />
      <use href="#heroWave" x="48" y="4" />
      <use href="#heroWave" x="48" y="6" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
.waves {
  position: absolute;
  right: -120px;
  bottom: -1px;
  left: -120px;
  z-index: 3;
  display: block;
  width: calc(100% + 240px);
  height: clamp(40px, 5vw, 62px);
  max-height: 62px;
  overflow: hidden;
  aspect-ratio: auto;
  pointer-events: none;
}

.parallax use {
  animation: drift 26s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
}

.parallax use:nth-child(1) {
  fill: color-mix(in oklab, var(--bg) 55%, transparent);
  animation-duration: 11s;
  animation-delay: -3s;
}

.parallax use:nth-child(2) {
  fill: color-mix(in oklab, var(--bg) 78%, transparent);
  animation-duration: 15s;
  animation-delay: -6s;
}

.parallax use:nth-child(3) {
  fill: var(--bg);
  animation-duration: 22s;
  animation-delay: -9s;
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
