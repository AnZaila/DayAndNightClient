<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { Eye, Heart, MessageCircle, PenLine } from '@lucide/vue'
import type { EChartsCoreOption } from 'echarts/core'
import AppChart from '@/components/common/AppChart.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import { fetchStats } from '@/api/stats'
import type { SiteStats } from '@/types/stats'
import { ApiError } from '@/utils/request'

const stats = ref<SiteStats | null>(null)
const failed = ref<string | null>(null)
const paint = ref(0)
let watchTheme: MutationObserver | null = null

onMounted(() => {
  void load()
  watchTheme = new MutationObserver(() => {
    paint.value += 1
  })
  watchTheme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onBeforeUnmount(() => {
  watchTheme?.disconnect()
})

async function load() {
  failed.value = null
  try {
    stats.value = await fetchStats()
  } catch (cause) {
    failed.value = cause instanceof ApiError ? cause.message : '统计没有读出来'
  }
}

function token(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function monthLabel(value: string) {
  const [year, month] = value.split('-')
  if (!year || !month) return value
  return `${year}年${Number(month)}月`
}

const figures = computed(() => {
  const current = stats.value
  if (!current) return []
  return [
    { label: '写下', value: current.posts, icon: PenLine as Component },
    { label: '看过', value: current.views, icon: Eye as Component },
    { label: '点赞', value: current.likes, icon: Heart as Component },
    { label: '评论', value: current.comments, icon: MessageCircle as Component },
  ]
})

const monthsOption = computed((): EChartsCoreOption => {
  paint.value
  const current = stats.value
  const ink = token('--heading', '#2c2438')
  const mute = token('--muted', '#6b6575')
  const fill = token('--primary-fill', '#6366f1')
  const line = token('--line', '#ddd')
  const labels = (current?.months ?? []).map((item) => monthLabel(item.month))
  return {
    color: [fill],
    textStyle: { color: ink, fontFamily: token('--font-body', 'sans-serif') },
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 12, top: 24, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: line } },
      axisLabel: { color: mute, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: line } },
      axisLabel: { color: mute },
    },
    series: [
      {
        type: 'bar',
        name: '篇数',
        data: (current?.months ?? []).map((item) => item.posts),
        barMaxWidth: 28,
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
    ],
  }
})

const moodsOption = computed((): EChartsCoreOption => {
  paint.value
  const current = stats.value
  const ink = token('--heading', '#2c2438')
  const fill = token('--primary-fill', '#6366f1')
  const soft = token('--primary-soft', '#c7c9f7')
  const ok = token('--ok', '#2f6b4f')
  const warn = token('--warning', '#8a6a24')
  const danger = token('--danger', '#8a2f32')
  return {
    color: [fill, ok, warn, danger, soft, ink],
    textStyle: { color: ink, fontFamily: token('--font-body', 'sans-serif') },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: ink } },
    series: [
      {
        type: 'pie',
        name: '心情',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        data: (current?.moods ?? []).map((item) => ({ name: item.name, value: item.count })),
        label: { color: ink },
      },
    ],
  }
})
</script>

<template>
  <section class="shell wide">
    <header class="mast">
      <div>
        <h1 class="page-title">这些日子</h1>
        <p class="lede">从写下的篇数、心情和大家的回应里，看这一段路。</p>
      </div>
    </header>
    <Skeleton v-if="!stats && !failed" preset="detail" />
    <p v-else-if="failed" class="error">{{ failed }}</p>
    <template v-else-if="stats">
      <ul class="figures">
        <li v-for="item in figures" :key="item.label" class="card">
          <span class="glyph">
            <component :is="item.icon" :size="22" />
          </span>
          <div>
            <p class="num">{{ item.value }}</p>
            <p>{{ item.label }}</p>
          </div>
        </li>
      </ul>
      <section class="card block">
        <h2>每月写下</h2>
        <p v-if="stats.months.length === 0" class="muted">还没有可以画的月份。</p>
        <AppChart v-else :option="monthsOption" />
      </section>
      <section class="card block">
        <h2>心情</h2>
        <p v-if="stats.moods.length === 0" class="muted">还没有记下心情。</p>
        <AppChart v-else :option="moodsOption" />
      </section>
    </template>
  </section>
</template>

<style scoped lang="scss">
.mast {
  margin-bottom: var(--space-md);
}

.lede {
  margin: var(--space-2xs) 0 0;
  color: var(--muted);
}

.figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-sm);
  margin: 0 0 var(--space-md);
  padding: 0;
  list-style: none;
}

.figures .card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
  padding: var(--space-md);
}

.glyph {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: var(--radius);
  background: var(--primary-soft);
  color: var(--primary);
}

.num {
  margin: 0;
  color: var(--heading);
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.figures p {
  margin: 0;
  color: var(--muted);
}

.block {
  margin-bottom: var(--space-md);
  padding: var(--space-md);

  h2 {
    margin: 0 0 var(--space-sm);
    color: var(--heading);
    font-size: var(--text-lg);
  }
}

.muted {
  margin: 0;
}

@media (max-width: 720px) {
  .figures {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
