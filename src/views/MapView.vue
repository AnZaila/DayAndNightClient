<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Maximize2, Minimize2 } from '@lucide/vue'
import { createMapDanmaku, fetchMapDanmaku, likeDanmaku } from '@/api/danmaku'
import { fetchPlaces } from '@/api/post'
import { usePaged } from '@/composables/usePaged'
import Skeleton from '@/components/common/Skeleton.vue'
import MapPoint from '@/components/common/MapPoint.vue'
import DanmakuForm from '@/components/danmaku/DanmakuForm.vue'
import DanmakuStage from '@/components/danmaku/DanmakuStage.vue'
import { pushToast } from '@/composables/useToast'
import type { PlacePin } from '@/types/place'
import { ApiError } from '@/utils/request'
import { formatDate } from '@/utils/text'

const { t } = useI18n()
const router = useRouter()
const places = ref<PlacePin[]>([])
const notes = usePaged((page) => fetchMapDanmaku(page, 20))
const error = ref<string | null>(null)
const ready = ref(false)
const filled = ref(true)

const markers = computed(() =>
  places.value.map((place) => ({
    id: place.id,
    latitude: place.latitude,
    longitude: place.longitude,
    label: place.location || formatDate(place.happenedAt),
    coverUrl: place.coverUrl,
  })),
)
const flying = computed(() => notes.items.value.filter((item) => item.status === 'VISIBLE'))

function toggleFullscreen() {
  filled.value = !filled.value
}

function syncFill(on: boolean) {
  document.documentElement.classList.toggle('map-fill', on)
}

watch(filled, (value) => syncFill(value), { immediate: true })

async function load() {
  try {
    places.value = await fetchPlaces()
    if (notes.page.value === 0) await notes.more()
    else await notes.open(1)
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : t('map.loadFailed')
  } finally {
    ready.value = true
  }
}

onMounted(() => {
  void load()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('map-fill')
})

function openPost(id: number) {
  void router.push({ name: 'post', params: { id } })
}

async function send(nickname: string | null, content: string, avatarUrl: string | null) {
  try {
    const created = await createMapDanmaku(nickname, content, avatarUrl)
    if (created.status === 'VISIBLE') notes.items.value = [created, ...notes.items.value]
    pushToast(created.status === 'VISIBLE' ? t('map.sent') : t('map.pending'))
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast(t('map.sendFailed'), 'error')
    throw cause
  }
}

async function likeNote(id: number) {
  const updated = await likeDanmaku(id)
  notes.items.value = notes.items.value.map((item) => (item.id === id ? updated : item))
}
</script>

<template>
  <section class="shell stack page" :class="{ fill: filled }">
    <div v-if="!filled">
      <h1 class="page-title">{{ t('map.title') }}</h1>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-else class="board card" :class="{ wait: !ready }">
      <Skeleton v-if="!ready" preset="map" />
      <MapPoint v-else :tall="!filled" :fill="filled" :markers="markers" @open="openPost" />
      <DanmakuStage v-if="ready" :items="flying" @like="likeNote" @need-more="notes.more" />
      <div v-if="ready" class="dock">
        <button
          class="fs"
          type="button"
          :aria-label="filled ? t('map.unfill') : t('map.fill')"
          :title="filled ? t('map.unfill') : t('map.fill')"
          @click="toggleFullscreen"
        >
          <Minimize2 v-if="filled" :size="16" />
          <Maximize2 v-else :size="16" />
        </button>
        <DanmakuForm :send="send" />
      </div>
    </div>
    <p v-if="ready && !error && places.length === 0 && !filled" class="muted">
      {{ t('map.empty') }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.page.fill {
  width: 100%;
  max-width: none;
  height: 100%;
  margin: 0;
  gap: 0;
}

.page.fill .board {
  flex: 1;
  min-height: 0;
  border-radius: 0;
}

.board {
  position: relative;
  padding: 0;
  overflow: hidden;
}

.board.wait {
  display: flex;
  min-height: 70vh;
}

.page.fill .board.wait {
  min-height: 0;
  flex: 1;
}

.page.fill .board.wait :deep(.map),
.page.fill .board.wait :deep(.map-bone) {
  min-height: 0;
  height: 100%;
}

:global(html.map-fill),
:global(html.map-fill body),
:global(html.map-fill #app) {
  height: 100%;
  overflow: clip;
}

:global(html.map-fill #app) {
  display: flex;
  flex-direction: column;
}

:global(html.map-fill #app > main) {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.dock {
  position: absolute;
  bottom: 16px;
  left: 50%;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  width: min(700px, calc(100% - 32px));
  padding: 6px;
  border-radius: var(--radius-pill);
  background: color-mix(in oklab, var(--surface) 86%, transparent);
  box-shadow:
    0 18px 40px -24px color-mix(in oklab, var(--color-ink) 70%, transparent),
    0 0 0 var(--rule-hair) color-mix(in oklab, var(--line) 70%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  transform: translateX(-50%);

  :deep(.bar) {
    flex: 1 1 auto;
    flex-wrap: nowrap;
    min-width: 0;
  }
}

.fs {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 50%;
  background: var(--field);
  color: var(--muted);
  cursor: pointer;
  transition:
    color var(--dur-short) var(--ease-out),
    background-color var(--dur-short) var(--ease-out);

  &:hover,
  &:focus-visible {
    background: var(--primary-soft);
    color: var(--primary);
  }
}

@media (max-width: 620px) {
  .dock {
    border-radius: var(--radius);
  }

  .dock :deep(.bar) {
    flex-wrap: wrap;
  }
}
</style>
