<script setup lang="ts">
import { CalendarDays, Heart } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import Skeleton from '@/components/common/Skeleton.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { useSiteStore } from '@/stores/site'

const { site } = storeToRefs(useSiteStore())
</script>

<template>
  <div>
    <section v-if="site" class="shell wide about">
      <div class="days">
        <p class="count">第 {{ site.daysTogether }} 天</p>
        <p class="together">
          <Heart :size="16" />
          在一起
        </p>
      </div>
      <div class="copy card">
        <h1>{{ site.title }}</h1>
        <p class="lead">{{ site.subtitle }}</p>
        <p class="body">{{ site.about || '这里还没有写介绍。' }}</p>
        <div class="row">
          <WaveLink class="btn solid" :to="{ name: 'timeline' }">去看时间轴</WaveLink>
          <WaveLink class="btn quiet" :to="{ name: 'anniversaries' }">
            <CalendarDays :size="16" />
            纪念日
          </WaveLink>
        </div>
      </div>
    </section>
    <Skeleton v-else class="shell wide" preset="about" />
  </div>
</template>

<style scoped lang="scss">
.about {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: var(--space-xl);
  align-items: center;
}

.days {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.together,
.lead {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--muted);
}

.count {
  margin: 0;
  color: var(--heading);
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  animation: rise var(--dur-long) var(--ease-out) both;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(var(--space-sm));
  }
}

.copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
}

h1 {
  color: var(--heading);
  font-size: var(--text-2xl);
  line-height: 1.15;
  overflow-wrap: break-word;
  min-width: 0;
  text-wrap: balance;
}

@media (prefers-reduced-motion: reduce) {
  .count {
    animation: none;
  }
}

@media (max-width: 720px) {
  .about {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-md);
  }
}

.body {
  white-space: pre-wrap;
}
</style>
