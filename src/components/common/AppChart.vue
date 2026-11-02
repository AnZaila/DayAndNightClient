<script setup lang="ts">
import { BarChart, PieChart } from 'echarts/charts'
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import type { EChartsCoreOption } from 'echarts/core'

use([
  CanvasRenderer,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
])

const props = defineProps<{
  option: EChartsCoreOption
}>()

const frame = useTemplateRef<HTMLDivElement>('frame')
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let chart: ReturnType<typeof init> | null = null
let resize: ResizeObserver | null = null

onMounted(() => {
  const el = frame.value
  if (!el) return
  chart = init(el)
  draw()
  resize = new ResizeObserver(() => chart?.resize())
  resize.observe(el)
})

onBeforeUnmount(() => {
  resize?.disconnect()
  chart?.dispose()
  chart = null
})

watch(
  () => props.option,
  () => draw(),
  { deep: true },
)

function draw() {
  chart?.setOption(
    {
      animation: !reduced,
      ...props.option,
    },
    true,
  )
}
</script>

<template>
  <div ref="frame" class="chart" role="img" />
</template>

<style scoped lang="scss">
.chart {
  width: 100%;
  height: 280px;
}
</style>
