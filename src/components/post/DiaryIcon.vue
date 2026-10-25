<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  Angry,
  Candy,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Frown,
  Heart,
  Home,
  Meh,
  Moon,
  Smile,
  Sparkles,
  Snowflake,
  Sun,
  Wind,
} from '@lucide/vue'

const props = defineProps<{
  kind: 'mood' | 'weather'
  value: string
  size?: number
}>()

const moods: Record<string, Component> = {
  开心: Smile,
  平静: Meh,
  想你: Heart,
  甜蜜: Candy,
  想家: Home,
  难过: Frown,
  烦躁: Angry,
  累了: Moon,
  期待: Sparkles,
}

const weather: Record<string, Component> = {
  晴: Sun,
  多云: CloudSun,
  阴: Cloud,
  小雨: CloudDrizzle,
  大雨: CloudRain,
  雷雨: CloudLightning,
  雪: Snowflake,
  大风: Wind,
  雾: CloudFog,
}

const icon = computed(() => (props.kind === 'mood' ? moods[props.value] : weather[props.value]) ?? (props.kind === 'mood' ? Smile : CloudSun))
</script>

<template>
  <component :is="icon" :size="size ?? 14" />
</template>
