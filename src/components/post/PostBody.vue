<script setup lang="ts">
import { computed } from 'vue'
import { vViewer } from 'v-viewer'
import 'v-viewer/style.css'
import { renderHtml } from '@/utils/text'

const buttonLabels: Record<string, string> = {
  'viewer-zoom-in': '放大',
  'viewer-zoom-out': '缩小',
  'viewer-one-to-one': '原始大小',
  'viewer-reset': '还原',
  'viewer-prev': '上一张',
  'viewer-play': '播放',
  'viewer-next': '下一张',
  'viewer-rotate-left': '向左旋转',
  'viewer-rotate-right': '向右旋转',
  'viewer-flip-horizontal': '水平翻转',
  'viewer-flip-vertical': '垂直翻转',
  'viewer-button': '关闭',
}

type GalleryElement = HTMLElement & {
  $viewer?: { viewer: HTMLElement }
}

const viewerOptions = {
  title: false,
  shown(event: Event) {
    const gallery = event.currentTarget
    if (!(gallery instanceof HTMLElement)) return
    const root = (gallery as GalleryElement).$viewer?.viewer
    if (!root) return
    for (const [className, label] of Object.entries(buttonLabels)) {
      root.querySelectorAll(`.${className}`).forEach((node) => {
        node.setAttribute('aria-label', label)
        node.setAttribute('title', label)
      })
    }
  },
}

const props = defineProps<{
  content: string
}>()

const html = computed(() => renderHtml(props.content))
</script>

<template>
  <div v-viewer="viewerOptions" class="rich" v-html="html" />
</template>
