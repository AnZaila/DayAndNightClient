<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePreferredReducedMotion } from '@vueuse/core'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { motion } from 'motion-v'
import { A11y, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperInstance } from 'swiper'
import 'swiper/css'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import type { Media } from '@/types/post'

const props = defineProps<{
  items: Media[]
  alt: string
  layoutId?: string
}>()

const { t } = useI18n()
const index = defineModel<number>({ default: 0 })
const deck = ref<SwiperInstance | null>(null)
const viewOpen = ref(false)
const many = computed(() => props.items.length > 1)
const current = computed(() => props.items[index.value] ?? props.items[0])
const reduce = usePreferredReducedMotion()
const speed = computed(() => (reduce.value === 'reduce' ? 0 : 480))
const modules = [A11y, Keyboard]

function bind(swiper: SwiperInstance) {
  deck.value = swiper
  sync(index.value, 0)
}

function onSlide(swiper: SwiperInstance) {
  index.value = swiper.realIndex
}

function sync(n: number, duration?: number) {
  const swiper = deck.value
  if (!swiper || swiper.realIndex === n) return
  if (many.value) swiper.slideToLoop(n, duration)
  else swiper.slideTo(n, duration)
}

function go(step: number) {
  if (step < 0) deck.value?.slidePrev()
  else deck.value?.slideNext()
}

watch(index, (n) => sync(n))
</script>

<template>
  <div v-if="items.length" class="gallery">
    <Swiper
      class="deck"
      :modules="modules"
      :initial-slide="index"
      :speed="speed"
      :loop="many"
      :allow-touch-move="many"
      :grab-cursor="many"
      :keyboard="{ enabled: true, onlyInViewport: true }"
      :a11y="{
        enabled: true,
        prevSlideMessage: t('post.prevPhoto'),
        nextSlideMessage: t('post.nextPhoto'),
      }"
      observer
      observe-parents
      @swiper="bind"
      @slide-change="onSlide"
    >
      <SwiperSlide v-for="(item, i) in items" :key="item.id">
        <motion.img
          :src="item.url"
          :alt="alt"
          draggable="false"
          :layout-id="i === 0 ? layoutId : undefined"
          @click="viewOpen = true"
        />
      </SwiperSlide>
    </Swiper>
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
    <ImageLightbox
      v-model:open="viewOpen"
      :src="current?.url || ''"
      :alt="alt"
    />
  </div>
</template>

<style scoped lang="scss">
.gallery {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: transparent;
}

.deck {
  width: 100%;
  height: 100%;
}

.gallery :deep(.swiper-wrapper),
.gallery :deep(.swiper-slide) {
  height: 100%;
}

.gallery :deep(.swiper-slide) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery :deep(img) {
  flex: none;
  width: auto;
  max-width: none;
  height: 100%;
  max-height: 100%;
  cursor: zoom-in;
  user-select: none;
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
  pointer-events: none;
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
</style>
