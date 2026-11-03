<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, Heart } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import Skeleton from '@/components/common/Skeleton.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { useSiteStore } from '@/stores/site'

const { t } = useI18n()
const { site } = storeToRefs(useSiteStore())

const since = computed(() => {
  const value = site.value?.togetherSince
  if (!value) return ''
  const parts = value.slice(0, 10).split('-').map(Number)
  const [year, month, day] = parts
  if (!year || !month || !day) return ''
  return t('date.ymd', { y: year, m: month, d: day })
})
</script>

<template>
  <div>
    <section v-if="site" class="shell wide about">
      <div class="ledger">
        <p class="since">{{ t('about.since', { date: since }) }}</p>
        <p class="count">
          <span class="num">{{ site.daysTogether }}</span
          ><span class="unit">{{ t('about.daysUnit') }}</span>
        </p>
        <p class="together">
          <Heart :size="15" />
          {{ t('about.together') }}
        </p>
      </div>
      <div class="letter">
        <h1>{{ site.title }}</h1>
        <p class="subtitle">{{ site.subtitle }}</p>
        <p class="body" :class="{ quiet: !site.about }">
          {{ site.about || t('about.empty') }}
        </p>
        <div class="row">
          <WaveLink class="btn solid" :to="{ name: 'timeline' }">{{
            t('about.toTimeline')
          }}</WaveLink>
          <WaveLink class="btn quiet" :to="{ name: 'anniversaries' }">
            <CalendarDays :size="16" />
            {{ t('nav.anniversaries') }}
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
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(var(--space-lg), 6vw, 88px);
  align-items: center;
  min-height: calc(100dvh - var(--header-height, 64px) - 220px);
  padding-block: clamp(48px, 10vh, 104px);
}

.ledger {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-right: clamp(var(--space-md), 4vw, 56px);
  border-right: var(--rule-hair) solid var(--line);
}

.since {
  margin: 0;
  color: var(--muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.count {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  margin: 0;
  color: var(--heading);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  line-height: 0.95;
}

.num {
  font-size: clamp(64px, 9vw, 108px);
  letter-spacing: -0.02em;
}

.unit {
  color: var(--muted);
  font-size: var(--text-xl);
}

.together {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  margin: 0;
  color: var(--primary);
  font-size: var(--text-sm);
}

.letter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xs);
  max-width: 34em;
}

h1 {
  margin: 0;
  color: var(--heading);
  font-size: clamp(28px, 3.4vw, 40px);
  line-height: 1.15;
  text-wrap: balance;
}

.subtitle {
  margin: 0;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: var(--text-lg);
}

.body {
  margin: var(--space-sm) 0 var(--space-xs);
  color: var(--text);
  font-size: var(--text-md);
  line-height: 1.85;
  white-space: pre-wrap;

  &.quiet {
    color: var(--faint);
  }
}

@media (max-width: 860px) {
  .about {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-lg);
    min-height: 0;
    padding-block: var(--space-lg);
  }

  .ledger {
    padding-right: 0;
    border-right: 0;
  }
}
</style>
