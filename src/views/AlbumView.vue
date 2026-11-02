<script setup lang="ts">
import { computed, ref } from 'vue'
import { Trash2 } from '@lucide/vue'
import { deleteAlbumPhoto, fetchAlbum, uploadAlbumPhoto } from '@/api/album'
import AppFilePicker from '@/components/common/AppFilePicker.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import ScrollSentinel from '@/components/common/ScrollSentinel.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import WaveLink from '@/components/common/WaveLink.vue'
import { usePaged } from '@/composables/usePaged'
import { pushToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import type { AlbumPhoto } from '@/types/album'
import { ApiError } from '@/utils/request'
import { formatDate } from '@/utils/text'

const session = useSessionStore()
const pageSize = 24
const album = usePaged((page) => fetchAlbum(page, pageSize))
const uploading = ref(false)
const pending = ref<AlbumPhoto | null>(null)
const active = ref<AlbumPhoto | null>(null)
const lightboxOpen = computed({
  get: () => active.value !== null,
  set(value: boolean) {
    if (!value) active.value = null
  },
})

void album.more()

function when(value: string) {
  return formatDate(value).replace(/ \d{2}:\d{2}:\d{2}$/, '')
}

async function add(files: File[]) {
  if (!files.length || uploading.value) return
  uploading.value = true
  let saved = 0
  try {
    for (const file of files) {
      await uploadAlbumPhoto(file)
      saved += 1
    }
    album.reset()
    await album.open(1)
    pushToast(saved === 1 ? '已放进相册' : `已放进 ${saved} 张`)
  } catch (cause) {
    if (saved) {
      album.reset()
      await album.open(1)
    }
    if (!(cause instanceof ApiError)) pushToast('没有传上去', 'error')
  } finally {
    uploading.value = false
  }
}

async function remove() {
  const photo = pending.value
  pending.value = null
  if (!photo || photo.kind !== 'ALBUM') return
  try {
    await deleteAlbumPhoto(photo.id)
    album.items.value = album.items.value.filter(
      (item) => !(item.kind === 'ALBUM' && item.id === photo.id),
    )
    album.total.value = Math.max(0, album.total.value - 1)
    pushToast('已从相册拿掉')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('没有删掉', 'error')
  }
}
</script>

<template>
  <section class="shell wide">
    <header class="mast">
      <div class="heading">
        <h1 class="page-title">相册</h1>
        <p v-if="album.total.value > 0" class="count">{{ album.total.value }} 张</p>
      </div>
      <AppFilePicker
        v-if="session.user"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hide-names
        :label="uploading ? '正在放进去' : '放进相册'"
        @select="add"
      />
    </header>
    <Skeleton v-if="album.loading.value && album.page.value === 0" preset="detail" />
    <p v-else-if="album.error.value" class="error">{{ album.error.value }}</p>
    <p v-else-if="album.items.value.length === 0" class="muted">还没有照片。</p>
    <ul v-if="album.items.value.length" class="grid">
      <li v-for="photo in album.items.value" :key="`${photo.kind}-${photo.id}`">
        <button type="button" class="shot" @click="active = photo">
          <img :src="photo.url" alt="" />
          <span class="veil">
            <span v-if="photo.kind === 'COVER'" class="mark">封面</span>
            <time :datetime="photo.takenAt">{{ when(photo.takenAt) }}</time>
          </span>
        </button>
        <WaveLink
          v-if="photo.postId"
          class="go"
          :to="{ name: 'post', params: { id: photo.postId } }"
        >
          看这篇
        </WaveLink>
        <button
          v-if="session.user && photo.kind === 'ALBUM'"
          type="button"
          class="drop"
          aria-label="从相册拿掉"
          @click="pending = photo"
        >
          <Trash2 :size="14" />
        </button>
      </li>
    </ul>
    <Skeleton v-if="album.loading.value && album.items.value.length" preset="detail" />
    <ScrollSentinel
      v-if="album.hasMore.value && album.page.value > 0"
      :key="album.page.value"
      @visible="album.more"
    />
    <ImageLightbox v-model:open="lightboxOpen" :src="active?.url || ''" alt="相册照片" />
    <ConfirmDialog
      :open="pending !== null"
      title="从相册拿掉？"
      description="删掉之后找不回来。封面还在原来的帖子上。"
      confirm-label="拿掉"
      tone="danger"
      @update:open="pending = $event ? pending : null"
      @confirm="remove"
    />
  </section>
</template>

<style scoped lang="scss">
.mast {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.heading {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.heading .page-title {
  margin: 0;
}

.count {
  margin: 0;
  color: var(--muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  position: relative;
  min-width: 0;
}

.shot {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: var(--radius);
  background: var(--field);
  cursor: zoom-in;
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--dur-long) var(--ease-out);
}

.shot:hover img {
  transform: scale(1.04);
}

.veil {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs);
  background: linear-gradient(transparent, color-mix(in oklab, var(--heading) 55%, transparent));
  color: var(--on-primary);
  font-size: 12px;
  pointer-events: none;
}

.mark,
time {
  min-width: 0;
  overflow-wrap: break-word;
}

.go,
.drop {
  position: absolute;
  z-index: 1;
  top: var(--space-xs);
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 var(--space-xs);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--heading);
  font-size: 12px;
  box-shadow: var(--shadow);
}

.go {
  left: var(--space-xs);
  opacity: 0;
  transform: translateY(-2px);
  transition:
    opacity var(--dur-short) var(--ease-out),
    transform var(--dur-short) var(--ease-out);
}

li:hover .go,
li:focus-within .go {
  opacity: 1;
  transform: none;
}

@media (hover: none) {
  .go {
    opacity: 1;
    transform: none;
  }
}

.drop {
  right: var(--space-xs);
  width: 28px;
  justify-content: center;
  color: var(--danger);
  cursor: pointer;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .shot:hover img {
    transform: none;
  }
}
</style>
