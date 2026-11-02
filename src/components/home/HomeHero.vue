<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  day: string
  meta: string
  posts: number
  days: number
  slogan?: string
  /** 想换成插画：把图放进 public/hero/，这里传 '/hero/xxx.jpg'。 */
  image?: string
}>()

const canvas = computed(() => ({
  '--hero-image': props.image ? `url(${props.image})` : 'none',
}))

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
  <section class="hero" :class="{ 'has-image': image }" :style="canvas">
    <div class="art" />
    <div class="grain" />
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

    <div class="copy">
      <div class="stamp">
        <p class="label">今天</p>
        <p class="day">{{ day }}</p>
        <p class="meta">{{ meta }}</p>
        <p v-if="slogan" class="slogan">{{ slogan }}</p>
      </div>
      <dl class="facts">
        <div>
          <dt>记下</dt>
          <dd>{{ posts }} 篇</dd>
        </div>
        <div v-if="days">
          <dt>在一起</dt>
          <dd>{{ days }} 天</dd>
        </div>
      </dl>
    </div>

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
  </section>
</template>

<style scoped lang="scss">
.hero {
  --hero-h: clamp(360px, 52vh, 520px);
  position: relative;
  display: grid;
  align-items: center;
  width: 100vw;
  min-height: var(--hero-h);
  margin: calc(-1 * var(--space-lg) - var(--header-height, 64px)) calc(50% - 50vw) var(--space-lg);
  padding: calc(var(--header-height, 64px) + var(--space-md))
    max(var(--space-lg), calc(50vw - var(--container) / 2)) clamp(56px, 6vw, 78px);
  overflow: hidden;
  color: #fff;
  isolation: isolate;
}

/* 画布：先用渐变和光斑撑出「海面 + 天光」，换成插画时只改 --hero-image。 */
.art {
  position: absolute;
  inset: 0;
  z-index: -2;
  background-color: #4d6bfe;
  background-image:
    linear-gradient(180deg, rgb(8 18 60 / 16%), rgb(8 18 60 / 34%)), var(--hero-image, none),
    radial-gradient(58% 80% at 82% 12%, rgb(255 255 255 / 34%), transparent 62%),
    radial-gradient(46% 60% at 12% 84%, rgb(16 48 170 / 45%), transparent 60%),
    linear-gradient(140deg, #4d6bfe 6%, #6f8bff 38%, #9db4ff 68%, #cfd8ff 100%);
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.hero.has-image .art {
  /* 头图 2400×1039：按视口宽度铺满，再垂直居中到头图高度里，湖面还在窗口中。 */
  background-color: #16233f;
  background-image:
    linear-gradient(180deg, rgb(6 14 48 / 42%) 0, rgb(6 14 48 / 0%) 120px),
    linear-gradient(180deg, rgb(6 14 48 / 30%), rgb(6 14 48 / 66%)), var(--hero-image, none);
  background-size: 100% auto;
  background-position: center calc((var(--hero-h) - 43.29vw) / 2);
}

[data-theme='dark'] .hero.has-image .art {
  background-image:
    linear-gradient(180deg, rgb(4 8 20 / 52%) 0, rgb(4 8 20 / 12%) 120px),
    linear-gradient(180deg, rgb(4 8 20 / 26%), rgb(4 8 20 / 72%)), var(--hero-image, none);
}

.grain {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
  opacity: 0.5;
}

.copy {
  position: relative;
  z-index: 2;
  display: grid;
  gap: var(--space-md);
  justify-items: center;
  color: #fff;
  text-align: center;
}

.stamp {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.label {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.24em;
  opacity: 0.82;
}

.day {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(38px, 5.6vw, 62px);
  letter-spacing: var(--tracking-display);
  line-height: 1.02;
}

.meta {
  margin: 0;
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  opacity: 0.78;
}

.slogan {
  margin: var(--space-2xs) 0 0;
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.08em;
  opacity: 0.92;
}

.facts {
  display: flex;
  gap: var(--space-xl);
  margin: 0;

  div {
    display: grid;
    gap: 2px;
    justify-items: center;
  }

  dt {
    font-size: 11px;
    letter-spacing: 0.12em;
    opacity: 0.7;
  }

  dd {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-variant-numeric: tabular-nums;
  }
}

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

.petal {
  position: absolute;
  top: -10%;
  z-index: 1;
  border-radius: 60% 40% 55% 45% / 55% 45% 60% 40%;
  background: rgb(255 226 238 / 95%);
  pointer-events: none;
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes drift {
  0% {
    transform: translateX(-90px);
  }

  100% {
    transform: translateX(85px);
  }
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
  .art {
    background-attachment: scroll;
  }

  .parallax use,
  .petal {
    animation: none;
  }

  .petal {
    display: none;
  }
}

@media (max-width: 720px) {
  .hero {
    --hero-h: 180px;
    padding: var(--space-md) var(--space-md) 52px;
  }

  .facts {
    gap: var(--space-md);
  }
}
</style>
