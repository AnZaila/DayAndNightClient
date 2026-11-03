<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HeroPetals from '@/components/home/HeroPetals.vue'
import HeroStamp from '@/components/home/HeroStamp.vue'
import HeroWaves from '@/components/home/HeroWaves.vue'

const props = defineProps<{
  day: string
  meta: string
  posts: number
  days: number
  slogan?: string
  /** 想换成插画：把图放进 public/hero/，这里传 '/hero/xxx.jpg'。 */
  image?: string
}>()

const { t } = useI18n()
const canvas = computed(() => ({
  '--hero-image': props.image ? `url(${props.image})` : 'none',
}))
</script>

<template>
  <section class="hero" :class="{ 'has-image': image }" :style="canvas">
    <div class="art" />
    <div class="grain" />
    <HeroPetals />

    <div class="copy">
      <HeroStamp :day="day" :meta="meta" :slogan="slogan" />
      <dl class="facts">
        <div>
          <dt>{{ t('hero.logged') }}</dt>
          <dd>{{ t('hero.posts', { n: posts }) }}</dd>
        </div>
        <div v-if="days">
          <dt>{{ t('hero.together') }}</dt>
          <dd>{{ t('hero.days', { n: days }) }}</dd>
        </div>
      </dl>
    </div>

    <HeroWaves />
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

@media (prefers-reduced-motion: reduce) {
  .art {
    background-attachment: scroll;
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
