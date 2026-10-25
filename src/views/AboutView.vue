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
    <section v-if="site" class="shell card about">
      <p class="kicker">
        <Heart :size="16" />
        在一起
      </p>
      <p class="count">第 {{ site.daysTogether }} 天</p>
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
    </section>
    <Skeleton v-else class="shell" preset="about" />
  </div>
</template>

<style scoped lang="scss">
.about {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  max-width: 640px;
}

.kicker,
.lead {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
}

.count {
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
}

h1 {
  color: var(--heading);
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
}

.body {
  max-width: 38em;
  white-space: pre-wrap;
}
</style>
