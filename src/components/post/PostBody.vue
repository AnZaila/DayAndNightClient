<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { vViewer } from 'v-viewer'
import 'v-viewer/style.css'
import { renderHtml } from '@/utils/text'

const { t } = useI18n()

const buttonLabels = computed<Record<string, string>>(() => ({
  'viewer-zoom-in': t('viewer.zoomIn'),
  'viewer-zoom-out': t('viewer.zoomOut'),
  'viewer-one-to-one': t('viewer.oneToOne'),
  'viewer-reset': t('viewer.reset'),
  'viewer-prev': t('viewer.prev'),
  'viewer-play': t('viewer.play'),
  'viewer-next': t('viewer.next'),
  'viewer-rotate-left': t('viewer.rotateLeft'),
  'viewer-rotate-right': t('viewer.rotateRight'),
  'viewer-flip-horizontal': t('viewer.flipH'),
  'viewer-flip-vertical': t('viewer.flipV'),
  'viewer-button': t('viewer.close'),
}))

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
    for (const [className, label] of Object.entries(buttonLabels.value)) {
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
