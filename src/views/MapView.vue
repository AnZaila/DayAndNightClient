<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Maximize2, Minimize2 } from '@lucide/vue'
import { createMapDanmaku, fetchMapDanmaku, likeDanmaku } from '@/api/danmaku'
import { fetchPlaces } from '@/api/post'
import AppButton from '@/components/common/AppButton.vue'
import MapPoint from '@/components/common/MapPoint.vue'
import DanmakuForm from '@/components/danmaku/DanmakuForm.vue'
import DanmakuStage from '@/components/danmaku/DanmakuStage.vue'
import { pushToast } from '@/composables/useToast'
import type { Danmaku } from '@/types/danmaku'
import type { PlacePin } from '@/types/place'
import { ApiError } from '@/utils/request'
import { formatDate } from '@/utils/text'

const router = useRouter()
const places = ref<PlacePin[]>([])
const danmaku = ref<Danmaku[]>([])
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
const flying = computed(() => danmaku.value.filter((item) => item.status === 'VISIBLE'))

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
    const [pins, notes] = await Promise.all([fetchPlaces(), fetchMapDanmaku()])
    places.value = pins
    danmaku.value = notes
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

async function send(nickname: string | null, content: string) {
  try {
    const created = await createMapDanmaku(nickname, content)
    if (created.status === 'VISIBLE') danmaku.value = [...danmaku.value, created]
    pushToast(created.status === 'VISIBLE' ? '已飞出去' : '已提交，待显示')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('弹幕没有发出去', 'error')
    throw cause
  }
}

async function likeNote(id: number) {
  const updated = await likeDanmaku(id)
  danmaku.value = danmaku.value.map((item) => (item.id === id ? updated : item))
}
</script>

<template>
  <section class="shell stack page" :class="{ fill: filled }">
    <div v-if="!filled">
      <h1 class="page-title">地图</h1>
      <p class="lede">标过地点的日子，点一下就能打开。</p>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-else class="board card">
      <MapPoint :tall="!filled" :fill="filled" :markers="markers" @open="openPost" />
      <DanmakuStage :items="flying" @like="likeNote" />
      <div class="dock">
        <AppButton variant="quiet" type="button" @click="toggleFullscreen">
          <Minimize2 v-if="filled" :size="16" />
          <Maximize2 v-else :size="16" />
          {{ filled ? '退出全屏' : '全屏' }}
        </AppButton>
        <DanmakuForm :send="send" />
      </div>
    </div>
    <p v-if="ready && !error && places.length === 0 && !filled" class="muted">还没有标过地点的帖子。</p>
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

:global(html.map-fill),
:global(html.map-fill body),
:global(html.map-fill #app) {
  height: 100%;
  overflow: hidden;
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
  right: 12px;
  bottom: 12px;
  left: 12px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding: 8px;
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
}
</style>
