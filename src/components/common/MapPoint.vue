<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export type MapMarker = {
  id: number
  latitude: number
  longitude: number
  label: string
  coverUrl?: string | null
}

const latitude = defineModel<number | null>('latitude', { default: null })
const longitude = defineModel<number | null>('longitude', { default: null })

const props = withDefaults(
  defineProps<{
    pick?: boolean
    tall?: boolean
    fill?: boolean
    markers?: MapMarker[]
  }>(),
  { pick: false, tall: false, fill: false, markers: () => [] },
)

const emit = defineEmits<{
  open: [id: number]
}>()

const MAP_W = 960
const MAP_H = 400

const frame = ref<HTMLElement | null>(null)
const frameW = ref(0)
const frameH = ref(0)
const centerLng = ref(longitude.value ?? 108.939174)
const centerLat = ref(latitude.value ?? 34.341568)
const zoom = ref(latitude.value != null && longitude.value != null ? 14 : 4)
const src = ref('')
const failed = ref('')
const useTiles = ref(false)
const userMoved = ref(false)
const view = ref({ x: 0, y: 0, scale: 1 })
const worldStyle = computed(() => ({
  transform: `translate3d(${view.value.x}px, ${view.value.y}px, 0) scale(${view.value.scale})`,
}))
let requestId = 0
let observer: ResizeObserver | null = null
let drag: {
  x: number
  y: number
  vx: number
  vy: number
  moved: boolean
} | null = null

const apiBase = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

function round6(value: number) {
  return Math.round(value * 1e6) / 1e6
}

function clampLat(value: number) {
  return Math.min(85, Math.max(-85, value))
}

function clampLng(value: number) {
  let next = value
  while (next > 180) next -= 360
  while (next < -180) next += 360
  return next
}

function project(lng: number, lat: number, level: number): [number, number] {
  const scale = 256 * 2 ** level
  const safeLat = clampLat(lat)
  const x = ((lng + 180) / 360) * scale
  const sine = Math.sin((safeLat * Math.PI) / 180)
  const y = (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale
  return [x, y]
}

function unproject(x: number, y: number, level: number): [number, number] {
  const scale = 256 * 2 ** level
  const lng = (x / scale) * 360 - 180
  const n = Math.PI - (2 * Math.PI * y) / scale
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n))
  return [lng, lat]
}

function shift(lng: number, lat: number, level: number, dx: number, dy: number): [number, number] {
  const [x, y] = project(lng, lat, level)
  return unproject(x + dx, y + dy, level)
}

function clearSrc() {
  if (!src.value) return
  URL.revokeObjectURL(src.value)
  src.value = ''
}

function tileUrl(x: number, y: number, level: number) {
  const host = (Math.abs(x + y) % 4) + 1
  return `https://webrd0${host}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${x}&y=${y}&z=${level}`
}

function tiles() {
  if (!useTiles.value || frameW.value < 1 || frameH.value < 1) return []
  const level = zoom.value
  const scale = view.value.scale || 1
  const [cx, cy] = project(centerLng.value, centerLat.value, level)
  const left = cx - frameW.value / 2
  const top = cy - frameH.value / 2
  const localLeft = (-frameW.value / 2 - view.value.x) / scale
  const localRight = (frameW.value / 2 - view.value.x) / scale
  const localTop = (-frameH.value / 2 - view.value.y) / scale
  const localBottom = (frameH.value / 2 - view.value.y) / scale
  const minX = Math.floor((cx + localLeft) / 256)
  const maxX = Math.floor((cx + localRight) / 256)
  const minY = Math.floor((cy + localTop) / 256)
  const maxY = Math.floor((cy + localBottom) / 256)
  const count = 2 ** level
  const list: { key: string; src: string; left: number; top: number }[] = []
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      if (y < 0 || y >= count) continue
      const wrapped = ((x % count) + count) % count
      list.push({
        key: `${level}-${x}-${y}`,
        src: tileUrl(wrapped, y, level),
        left: x * 256 - left,
        top: y * 256 - top,
      })
    }
  }
  return list
}

function markerStyle(lat: number, lng: number) {
  const [mx, my] = project(lng, lat, zoom.value)
  const [cx, cy] = project(centerLng.value, centerLat.value, zoom.value)
  if (useTiles.value) {
    return {
      left: `${mx - (cx - frameW.value / 2)}px`,
      top: `${my - (cy - frameH.value / 2)}px`,
    }
  }
  return {
    left: `${((mx - cx) / MAP_W + 0.5) * 100}%`,
    top: `${((my - cy) / MAP_H + 0.5) * 100}%`,
  }
}

function fitMarkers(list: MapMarker[]) {
  view.value = { x: 0, y: 0, scale: 1 }
  let minLat = 90
  let maxLat = -90
  let minLng = 180
  let maxLng = -180
  for (const item of list) {
    minLat = Math.min(minLat, item.latitude)
    maxLat = Math.max(maxLat, item.latitude)
    minLng = Math.min(minLng, item.longitude)
    maxLng = Math.max(maxLng, item.longitude)
  }
  centerLat.value = round6((minLat + maxLat) / 2)
  centerLng.value = round6((minLng + maxLng) / 2)
  const width = frameW.value || 800
  const height = frameH.value || 400
  for (let level = 14; level >= 3; level -= 1) {
    const [x1, y1] = project(minLng, maxLat, level)
    const [x2, y2] = project(maxLng, minLat, level)
    if (Math.abs(x2 - x1) < width * 0.72 && Math.abs(y2 - y1) < height * 0.72) {
      zoom.value = level
      return
    }
  }
  zoom.value = 3
}

async function loadMap() {
  if (useTiles.value) return
  const current = ++requestId
  failed.value = ''
  const params = new URLSearchParams({
    lng: centerLng.value.toFixed(6),
    lat: centerLat.value.toFixed(6),
    zoom: String(zoom.value),
  })
  if (latitude.value != null && longitude.value != null) {
    params.set('markerLng', longitude.value.toFixed(6))
    params.set('markerLat', latitude.value.toFixed(6))
  }
  try {
    const response = await fetch(`${apiBase}/maps/static?${params}`, { credentials: 'include' })
    if (current !== requestId) return
    if (!response.ok) {
      useTiles.value = true
      clearSrc()
      return
    }
    const blob = await response.blob()
    if (current !== requestId) return
    if (!blob.type.startsWith('image/')) {
      useTiles.value = true
      clearSrc()
      return
    }
    const next = URL.createObjectURL(blob)
    clearSrc()
    src.value = next
  } catch {
    if (current !== requestId) return
    useTiles.value = true
    clearSrc()
  }
}

function place(lng: number, lat: number, level: number) {
  const nextLat = round6(clampLat(lat))
  const nextLng = round6(clampLng(lng))
  view.value = { x: 0, y: 0, scale: 1 }
  latitude.value = nextLat
  longitude.value = nextLng
  centerLat.value = nextLat
  centerLng.value = nextLng
  if (level <= 5) zoom.value = 14
}

function worldShift(clientX: number, clientY: number, rect: DOMRect) {
  const sx = clientX - rect.left - rect.width / 2
  const sy = clientY - rect.top - rect.height / 2
  let x = (sx - view.value.x) / view.value.scale
  let y = (sy - view.value.y) / view.value.scale
  if (!useTiles.value) {
    x *= MAP_W / rect.width
    y *= MAP_H / rect.height
  }
  return { x, y }
}

function screenCenterShift() {
  const rect = frame.value?.getBoundingClientRect()
  if (!rect || rect.width < 1 || rect.height < 1) return { x: 0, y: 0 }
  let x = -view.value.x / view.value.scale
  let y = -view.value.y / view.value.scale
  if (!useTiles.value) {
    x *= MAP_W / rect.width
    y *= MAP_H / rect.height
  }
  return { x, y }
}

function rebasePan() {
  const { x, y } = screenCenterShift()
  if (x !== 0 || y !== 0) {
    const [lng, lat] = shift(centerLng.value, centerLat.value, zoom.value, x, y)
    centerLng.value = round6(clampLng(lng))
    centerLat.value = round6(clampLat(lat))
  }
  view.value = { x: 0, y: 0, scale: view.value.scale }
}

function promoteZoom(direction: 1 | -1) {
  const { x, y } = screenCenterShift()
  const [lng, lat] = shift(centerLng.value, centerLat.value, zoom.value, x, y)
  centerLng.value = round6(clampLng(lng))
  centerLat.value = round6(clampLat(lat))
  zoom.value += direction
  view.value = {
    x: 0,
    y: 0,
    scale: direction > 0 ? view.value.scale / 2 : view.value.scale * 2,
  }
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.target
  if (target instanceof Element && target.closest('button')) return
  const host = event.currentTarget
  if (!(host instanceof HTMLElement)) return
  try {
    host.setPointerCapture(event.pointerId)
  } catch {
    /* untrusted events cannot capture the pointer */
  }
  event.preventDefault()
  drag = {
    x: event.clientX,
    y: event.clientY,
    vx: view.value.x,
    vy: view.value.y,
    moved: false,
  }
}

function onPointerMove(event: PointerEvent) {
  if (!drag) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (Math.hypot(dx, dy) > 4) {
    drag.moved = true
    userMoved.value = true
  }
  view.value = { x: drag.vx + dx, y: drag.vy + dy, scale: view.value.scale }
  if (useTiles.value && Math.hypot(view.value.x, view.value.y) > 160) {
    rebasePan()
    drag.x = event.clientX
    drag.y = event.clientY
    drag.vx = view.value.x
    drag.vy = view.value.y
  }
}

function onPointerUp(event: PointerEvent) {
  const current = drag
  drag = null
  if (!current) return
  if (current.moved) {
    rebasePan()
    return
  }
  if (!props.pick) return
  const host = event.currentTarget
  if (!(host instanceof HTMLElement)) return
  const rect = host.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return
  const local = worldShift(event.clientX, event.clientY, rect)
  const [lng, lat] = shift(centerLng.value, centerLat.value, zoom.value, local.x, local.y)
  place(lng, lat, zoom.value)
}

function onPointerCancel() {
  if (drag?.moved) rebasePan()
  drag = null
}

function changeZoom(delta: number) {
  const next = Math.min(17, Math.max(3, zoom.value + delta))
  if (next === zoom.value) return
  userMoved.value = true
  const { x, y } = screenCenterShift()
  const [lng, lat] = shift(centerLng.value, centerLat.value, zoom.value, x, y)
  centerLng.value = round6(clampLng(lng))
  centerLat.value = round6(clampLat(lat))
  zoom.value = next
  view.value = { x: 0, y: 0, scale: 1 }
}

function onWheel(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey) return
  event.preventDefault()
  const host = frame.value
  if (!host) return
  const rect = host.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return
  let delta = event.deltaY
  if (event.deltaMode === 1) delta *= 16
  else if (event.deltaMode === 2) delta *= rect.height
  const cx = event.clientX - rect.left - rect.width / 2
  const cy = event.clientY - rect.top - rect.height / 2
  const current = view.value.scale
  let factor = Math.exp(-delta * 0.0016)
  if (zoom.value >= 17) factor = Math.min(factor, 1 / current)
  if (zoom.value <= 3) factor = Math.max(factor, 1 / current)
  const nextScale = Math.min(8, Math.max(0.2, current * factor))
  if (Math.abs(nextScale - current) < 1e-4) return
  userMoved.value = true
  const applied = nextScale / current
  view.value = {
    x: cx - (cx - view.value.x) * applied,
    y: cy - (cy - view.value.y) * applied,
    scale: nextScale,
  }
  while (view.value.scale >= 2 && zoom.value < 17) promoteZoom(1)
  while (view.value.scale <= 0.5 && zoom.value > 3) promoteZoom(-1)
}

watch([latitude, longitude], ([lat, lng]) => {
  if (lat == null || lng == null) return
  if (lat === centerLat.value && lng === centerLng.value) return
  view.value = { x: 0, y: 0, scale: 1 }
  centerLat.value = lat
  centerLng.value = lng
  if (zoom.value <= 5) zoom.value = 14
})

watch([centerLng, centerLat, zoom, latitude, longitude], () => void loadMap(), { immediate: true })

watch([() => props.markers, frameW, frameH], () => {
  if (userMoved.value || props.markers.length === 0 || frameW.value < 1) return
  fitMarkers(props.markers)
})

onMounted(() => {
  const host = frame.value
  if (!host) return
  observer = new ResizeObserver(() => {
    frameW.value = host.clientWidth
    frameH.value = host.clientHeight
  })
  observer.observe(host)
  host.addEventListener('wheel', onWheel, { passive: false })
  frameW.value = host.clientWidth
  frameH.value = host.clientHeight
})

onBeforeUnmount(() => {
  requestId += 1
  frame.value?.removeEventListener('wheel', onWheel)
  observer?.disconnect()
  clearSrc()
})
</script>

<template>
  <div
    ref="frame"
    class="map"
    :class="{ pick, tall, fill }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div class="world" :style="worldStyle">
      <div v-if="useTiles" class="tiles">
        <img
          v-for="tile in tiles()"
          :key="tile.key"
          class="tile"
          :src="tile.src"
          :style="{ left: `${tile.left}px`, top: `${tile.top}px` }"
          alt=""
          draggable="false"
          referrerpolicy="no-referrer"
        />
      </div>
      <img v-else-if="src" class="shot" :src="src" alt="" draggable="false" />
      <p v-else class="map-note">{{ failed || '地图加载中' }}</p>
      <span
        v-if="useTiles && latitude != null && longitude != null"
        class="pin here"
        :style="markerStyle(latitude, longitude)"
      />
      <button
        v-for="marker in markers"
        :key="marker.id"
        type="button"
        class="pin jump"
        :class="{ photo: marker.coverUrl }"
        :style="markerStyle(marker.latitude, marker.longitude)"
        @click="emit('open', marker.id)"
      >
        <img v-if="marker.coverUrl" :src="marker.coverUrl" alt="" draggable="false" />
        <span>{{ marker.label }}</span>
      </button>
    </div>
    <div class="tools">
      <button type="button" aria-label="放大" :disabled="zoom >= 17" @click="changeZoom(1)">
        +
      </button>
      <button type="button" aria-label="缩小" :disabled="zoom <= 3" @click="changeZoom(-1)">
        −
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.map {
  position: relative;
  width: 100%;
  aspect-ratio: 960 / 400;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--field);
  cursor: grab;
  user-select: none;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }

  &.pick {
    cursor: crosshair;
  }

  &.tall {
    aspect-ratio: auto;
    height: min(72vh, 760px);
  }

  &.fill {
    aspect-ratio: auto;
    height: 100%;
    border-radius: 0;
  }
}

.world {
  position: absolute;
  inset: 0;
  transform-origin: center center;
  will-change: transform;
}

.tiles,
.shot {
  position: absolute;
  inset: 0;
}

.shot {
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}

.tile {
  position: absolute;
  width: 256px;
  height: 256px;
  max-width: none;
  pointer-events: none;
}

.map-note {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: var(--space-md);
  color: var(--muted);
  text-align: center;
}

.pin {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
}

.here {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-paper-2);
  border-radius: 50%;
  background: var(--primary-fill);
  box-shadow: 0 0 0 var(--space-2xs) var(--primary-soft);
  pointer-events: none;
}

.jump {
  max-width: 160px;
  padding: var(--space-2xs) var(--space-xs);
  border-radius: 999px;
  background: var(--surface);
  color: var(--heading);
  font-size: 12px;
  line-height: 1.3;
  box-shadow: var(--shadow);
  cursor: pointer;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    z-index: 4;
  }

  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.photo {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 156px;
    max-width: 156px;
    padding: 5px 5px 7px;
    border-radius: 14px;
    white-space: normal;
    transform: translate(-50%, calc(-100% - 8px));
    transition:
      transform var(--dur-short) var(--ease-out),
      box-shadow var(--dur-short) var(--ease-out);

    img {
      width: 100%;
      height: 100px;
      max-width: none;
      object-fit: cover;
      border-radius: 10px;
    }

    span {
      padding-inline: 3px;
      font-size: 11.5px;
      font-weight: 500;
    }

    &:hover,
    &:focus-visible {
      box-shadow: 0 18px 34px -18px color-mix(in oklab, var(--color-ink) 60%, transparent);
      transform: translate(-50%, calc(-100% - 10px));
    }
  }
}

.tools {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 6px;

  button {
    width: 34px;
    height: 34px;
    border-radius: 11px;
    background: color-mix(in oklab, var(--surface) 92%, transparent);
    color: var(--heading);
    box-shadow: 0 10px 24px -16px color-mix(in oklab, var(--color-ink) 60%, transparent);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition:
      background-color var(--dur-short) var(--ease-out),
      color var(--dur-short) var(--ease-out);

    &:hover:not(:disabled) {
      color: var(--primary);
    }

    &:disabled {
      cursor: default;
      background: var(--field);
      color: var(--muted);
    }
  }
}
</style>
