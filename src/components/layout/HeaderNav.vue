<script setup lang="ts">
import { CalendarDays, ChartColumn, Images, Info, Map, Milestone } from '@lucide/vue'
import type { Component } from 'vue'
import WaveLink from '@/components/common/WaveLink.vue'

type NavRoute = 'timeline' | 'map' | 'album' | 'anniversaries' | 'about' | 'stats'

const items: { name: NavRoute; label: string; icon: Component }[] = [
  { name: 'timeline', label: '时间轴', icon: Milestone },
  { name: 'map', label: '地图', icon: Map },
  { name: 'album', label: '相册', icon: Images },
  { name: 'anniversaries', label: '纪念日', icon: CalendarDays },
  { name: 'about', label: '关于', icon: Info },
  { name: 'stats', label: '统计', icon: ChartColumn },
]
</script>

<template>
  <nav>
    <WaveLink v-for="item in items" :key="item.name" :to="{ name: item.name }">
      <component :is="item.icon" :size="16" />
      {{ item.label }}
    </WaveLink>
  </nav>
</template>

<style scoped lang="scss">
@use '../../assets/styles/header-controls' as hc;

nav {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-xs);
}

nav a {
  @include hc.control;
  @include hc.underline;
}

nav a.router-link-active {
  @include hc.active;
}
</style>
