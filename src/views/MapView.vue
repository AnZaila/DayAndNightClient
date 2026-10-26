<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Maximize2, Minimize2 } from '@lucide/vue'
import { createMapDanmaku, fetchMapDanmaku, likeDanmaku } from '@/api/danmaku'
import { fetchPlaces } from '@/api/post'
import { usePaged } from '@/composables/usePaged'
import AppButton from '@/components/common/AppButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import MapPoint from '@/components/common/MapPoint.vue'
import DanmakuForm from '@/components/danmaku/DanmakuForm.vue'
import DanmakuStage from '@/components/danmaku/DanmakuStage.vue'
import { pushToast } from '@/composables/useToast'
import type { PlacePin } from '@/types/place'
import { ApiError } from '@/utils/request'
import { formatDate } from '@/utils/text'

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

watch(
  filled,
  (value) => {
    document.documentElement.classList.toggle('map-fill', value)
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    places.value = await fetchPlaces()
    await notes.more()
  } catch {
    error.value = '地图没有加载出来。'
  } finally {
    ready.value = true
  }
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
    pushToast(created.status === 'VISIBLE' ? '已飞出去' : '已提交，待显示')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('弹幕没有发出去', 'error')
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
      <h1 class="page-title">地图</h1>
      <p class="lede">标过地点的日子，点一下就能打开。</p>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-else class="board card" :class="{ wait: !ready }">
      <Skeleton v-if="!ready" preset="map" />
      <MapPoint v-else :tall="!filled" :fill="filled" :markers="markers" @open="openPost" />
      <DanmakuStage v-if="ready" :items="flying" @like="likeNote" @need-more="notes.more" />
      <div v-if="ready" class="dock">
        <AppButton variant="quiet" type="button" @click="toggleFullscreen">
          <Minimize2 v-if="filled" :size="16" />
          <Maximize2 v-else :size="16" />
          {{ filled ? '退出全屏' : '全屏' }}
        </AppButton>
        <DanmakuForm :send="send" />
      </div>
    </div>
    <p v-if="ready && !error && places.length === 0 && !filled" class="muted">
      还没有标过地点的帖子。
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
  width: 50%;
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  align-items: flex-start;
  padding: var(--space-xs);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--surface) 78%, transparent);

  :deep(.bar) {
    width: 100%;
  }
}
</style>
