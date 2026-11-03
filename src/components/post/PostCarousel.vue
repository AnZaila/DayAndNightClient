<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { motion } from 'motion-v'
import type { Media } from '@/types/post'

const props = defineProps<{
  items: Media[]
  alt: string
  layoutId?: string
}>()

const { t } = useI18n()
const index = defineModel<number>({ default: 0 })
const current = computed(() => props.items[index.value] ?? props.items[0])
const many = computed(() => props.items.length > 1)

function go(step: number) {
  if (!props.items.length) return
  index.value = (index.value + step + props.items.length) % props.items.length
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') go(-1)
  if (event.key === 'ArrowRight') go(1)
}
</script>

<template>
  <div v-if="current" class="gallery" tabindex="0" @keydown="onKey">
    <div class="hero">
      <motion.img
        :src="current.url"
        :alt="alt"
        :layout-id="index === 0 ? layoutId : undefined"
      />
      <button
        v-if="many"
        type="button"
        class="nav prev"
        :aria-label="t('post.prevPhoto')"
        @click="go(-1)"
      >
        <ChevronLeft :size="20" />
      </button>
      <button
        v-if="many"
        type="button"
        class="nav next"
        :aria-label="t('post.nextPhoto')"
        @click="go(1)"
      >
        <ChevronRight :size="20" />
      </button>
      <p v-if="many" class="count">{{ index + 1 }}/{{ items.length }}</p>
      <div v-if="many" class="dots">
        <button
          v-for="(item, i) in items"
          :key="item.id"
          type="button"
          class="dot"
          :class="{ on: i === index }"
          :aria-label="t('post.photoIndex', { n: i + 1, total: items.length })"
          @click="index = i"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.gallery {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: transparent;
  outline: none;

  &:focus-visible {
    box-shadow: inset var(--ring);
  }
}

.hero {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.hero > img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.nav {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgb(255 255 255 / 88%);
  color: #1b1f27;
  cursor: pointer;
  translate: 0 -50%;

  &:hover {
    background: #fff;
  }

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  &.prev {
    left: 12px;
  }

  &.next {
    right: 12px;
  }
}

.count {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  margin: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgb(0 0 0 / 45%);
  color: #fff;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  z-index: 2;
  display: flex;
  gap: 6px;
  translate: -50% 0;
}

.dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border-radius: 999px;
  background: rgb(255 255 255 / 42%);
  cursor: pointer;

  &.on {
    background: #fff;
  }

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero > img {
    transition: none;
  }
}
</style>
