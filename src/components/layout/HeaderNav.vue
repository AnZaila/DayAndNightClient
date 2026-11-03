<script setup lang="ts">
import { CalendarDays, ChartColumn, Images, Info, Map, Milestone } from '@lucide/vue'
import type { Component } from 'vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WaveLink from '@/components/common/WaveLink.vue'

type NavRoute = 'timeline' | 'map' | 'album' | 'anniversaries' | 'about' | 'stats'

const { t } = useI18n()
const items = computed(() => {
  const rows: { name: NavRoute; label: string; icon: Component }[] = [
    { name: 'timeline', label: t('nav.timeline'), icon: Milestone },
    { name: 'map', label: t('nav.map'), icon: Map },
    { name: 'album', label: t('nav.album'), icon: Images },
    { name: 'anniversaries', label: t('nav.anniversaries'), icon: CalendarDays },
    { name: 'about', label: t('nav.about'), icon: Info },
    { name: 'stats', label: t('nav.stats'), icon: ChartColumn },
  ]
  return rows
})
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
