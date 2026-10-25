<script setup lang="ts">
import { computed } from 'vue'
import { renderHtml } from '@/utils/text'

const props = defineProps<{
  content: string
}>()

const html = computed(() => renderHtml(props.content))
</script>

<template>
  <div class="rich" v-html="html" />
</template>
