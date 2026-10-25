<script setup lang="ts">
import { computed, ref, shallowRef, toRaw, watch } from 'vue'
import { ChevronLeft, ChevronRight, RefreshCw } from '@lucide/vue'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import AppButton from '@/components/common/AppButton.vue'
import { pushToast } from '@/composables/useToast'
import VueColorAvatar from '@/vendor/vue-color-avatar/components/VueColorAvatar.vue'
import { Gender, WidgetType, WrapperShape } from '@/vendor/vue-color-avatar/enums'
import type { AvatarOption } from '@/vendor/vue-color-avatar/types'
import { getRandomAvatarOption } from '@/vendor/vue-color-avatar/utils'
import { SETTINGS } from '@/vendor/vue-color-avatar/utils/constant'

const EXPORT_SIZE = 512
const SQUIRCLE_RADIUS = 0.2

const SHAPE_LABELS: Record<string, string> = {
  none: '无',
  base: '默认',
  fonze: '短发',
  funny: '卷毛',
  clean: '光头',
  punk: '朋克',
  danny: '中分',
  wave: '波浪',
  turban: '头巾',
  pixie: '精灵短发',
  beanie: '毛线帽',
  attached: '贴耳',
  detached: '招风耳',
  hoop: '圆环',
  stud: '耳钉',
  up: '上挑',
  down: '下垂',
  eyelashesup: '上睫毛',
  eyelashesdown: '下睫毛',
  ellipse: '椭圆',
  smiling: '笑眼',
  eyeshadow: '眼影',
  round: '圆形',
  curve: '曲线',
  pointed: '尖鼻',
  frown: '皱眉',
  laughing: '大笑',
  nervous: '紧张',
  pucker: '嘟嘴',
  sad: '难过',
  smile: '微笑',
  smirk: '坏笑',
  surprised: '惊讶',
  scruff: '胡茬',
  crew: '圆领',
  collared: '衬衫',
  open: '开领',
  square: '方框',
}

const widgetControls: { type: WidgetType; label: string }[] = [
  { type: WidgetType.Tops, label: '发型' },
  { type: WidgetType.Eyes, label: '眼睛' },
  { type: WidgetType.Eyebrows, label: '眉毛' },
  { type: WidgetType.Nose, label: '鼻子' },
  { type: WidgetType.Mouth, label: '嘴巴' },
  { type: WidgetType.Clothes, label: '衣服' },
  { type: WidgetType.Glasses, label: '眼镜' },
  { type: WidgetType.Earrings, label: '耳饰' },
  { type: WidgetType.Beard, label: '胡须' },
  { type: WidgetType.Ear, label: '耳朵' },
]

const props = withDefaults(
  defineProps<{
    open: boolean
    loading?: boolean
  }>(),
  { loading: false },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [file: File]
}>()

const genderPref = ref<'any' | 'male' | 'female'>('any')
const option = shallowRef<AvatarOption>(createOption())
const avatarRef = ref<{ avatarRef?: HTMLDivElement }>()
const exporting = ref(false)
const busy = computed(() => props.loading || exporting.value)

function cloneOption(value: AvatarOption): AvatarOption {
  return JSON.parse(JSON.stringify(toRaw(value))) as AvatarOption
}

function createOption(previous?: AvatarOption): AvatarOption {
  const next = getRandomAvatarOption(
    {
      wrapperShape: WrapperShape.Squircle,
      gender:
        genderPref.value === 'any'
          ? undefined
          : genderPref.value === 'male'
            ? Gender.Male
            : Gender.Female,
    },
    previous,
  )
  next.wrapperShape = WrapperShape.Squircle
  next.background.borderColor = 'transparent'
  if (next.background.color === 'transparent') {
    next.background.color = SETTINGS.commonColors[0] ?? '#D2EFF3'
  }
  return next
}

function randomize() {
  option.value = createOption(option.value)
}

function patch(mutator: (draft: AvatarOption) => void) {
  const draft = cloneOption(option.value)
  mutator(draft)
  option.value = draft
}

function shapeLabel(type: WidgetType) {
  const shape = option.value.widgets[type]?.shape ?? 'none'
  return SHAPE_LABELS[shape] ?? shape
}

function cycleWidget(type: WidgetType, delta: number) {
  const list = (SETTINGS as unknown as Record<string, string[]>)[`${type}Shape`] ?? []
  const first = list[0]
  if (!first) return
  const current = option.value.widgets[type]?.shape ?? first
  const index = Math.max(0, list.indexOf(current))
  const next = list[(index + delta + list.length) % list.length] ?? first
  patch((draft) => {
    const currentWidget = draft.widgets[type] ?? { shape: next }
    draft.widgets[type] = { ...currentWidget, shape: next } as never
  })
}

function setWidgetColor(type: 'face' | 'tops' | 'clothes', color: string) {
  patch((draft) => {
    const currentWidget = draft.widgets[type] ?? { shape: 'base' }
    draft.widgets[type] = { ...currentWidget, fillColor: color } as never
  })
}

function setBackground(color: string) {
  patch((draft) => {
    draft.background.color = color === 'transparent' ? '#ffffff' : color
    draft.background.borderColor = 'transparent'
  })
}

function paintBackground(ctx: CanvasRenderingContext2D, color: string, size: number) {
  const matched = color.match(
    /^linear-gradient\(([-\d.]+)deg,\s*(#[0-9A-Fa-f]{3,8}),\s*(#[0-9A-Fa-f]{3,8})\)$/i,
  )
  if (matched?.[1] && matched[2] && matched[3]) {
    const deg = Number(matched[1])
    const rad = (deg * Math.PI) / 180
    const radius = size / 2
    const dx = Math.sin(rad) * radius
    const dy = -Math.cos(rad) * radius
    const fill = ctx.createLinearGradient(radius - dx, radius - dy, radius + dx, radius + dy)
    fill.addColorStop(0, matched[2])
    fill.addColorStop(1, matched[3])
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, size, size)
    return
  }
  ctx.fillStyle = !color || color === 'transparent' ? '#ffffff' : color
  ctx.fillRect(0, 0, size, size)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('头像导出失败'))
    image.src = src
  })
}

async function waitForSvg(root: HTMLElement) {
  for (let i = 0; i < 30; i += 1) {
    if (root.querySelector('.avatar-payload svg g')) return
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('头像尚未生成')
}

async function exportAvatar(root: HTMLElement, current: AvatarOption) {
  await waitForSvg(root)
  const svg = root.querySelector('.avatar-payload svg')
  if (!svg) throw new Error('头像尚未生成')
  const cloned = svg.cloneNode(true) as SVGSVGElement
  cloned.setAttribute('width', String(EXPORT_SIZE))
  cloned.setAttribute('height', String(EXPORT_SIZE))
  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const xml = new XMLSerializer().serializeToString(cloned)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = EXPORT_SIZE
    canvas.height = EXPORT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('头像导出失败')
    const radius = EXPORT_SIZE * SQUIRCLE_RADIUS
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.arcTo(EXPORT_SIZE, 0, EXPORT_SIZE, EXPORT_SIZE, radius)
    ctx.arcTo(EXPORT_SIZE, EXPORT_SIZE, 0, EXPORT_SIZE, radius)
    ctx.arcTo(0, EXPORT_SIZE, 0, 0, radius)
    ctx.arcTo(0, 0, EXPORT_SIZE, 0, radius)
    ctx.closePath()
    ctx.clip()
    paintBackground(ctx, current.background.color, EXPORT_SIZE)
    ctx.drawImage(image, 0, 0, EXPORT_SIZE, EXPORT_SIZE)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((data) => (data ? resolve(data) : reject(new Error('头像导出失败'))), 'image/png')
    })
    return new File([blob], 'avatar.png', { type: 'image/png' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function confirm() {
  const root = avatarRef.value?.avatarRef
  if (!root) {
    pushToast('头像还没准备好', 'error')
    return
  }
  exporting.value = true
  try {
    const file = await exportAvatar(root, option.value)
    exporting.value = false
    emit('confirm', file)
  } catch (error) {
    exporting.value = false
    pushToast(error instanceof Error ? error.message : '头像导出失败', 'error')
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      exporting.value = false
      randomize()
    }
  },
)
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent class="content">
        <DialogTitle class="title">生成头像</DialogTitle>
        <DialogDescription class="sr-only">调整五官和颜色，确认后作为头像。</DialogDescription>
        <div class="layout">
          <div class="preview">
            <VueColorAvatar ref="avatarRef" :option="option" :size="220" />
            <AppButton variant="quiet" type="button" :disabled="busy" @click="randomize">
              <RefreshCw :size="16" />
              随机
            </AppButton>
          </div>
          <div class="controls">
            <div class="block">
              <span>形象</span>
              <div class="choices">
                <button type="button" :class="{ on: genderPref === 'any' }" @click="genderPref = 'any'">不限</button>
                <button type="button" :class="{ on: genderPref === 'male' }" @click="genderPref = 'male'">男性</button>
                <button type="button" :class="{ on: genderPref === 'female' }" @click="genderPref = 'female'">
                  女性
                </button>
              </div>
            </div>
            <div class="parts">
              <div v-for="item in widgetControls" :key="item.type" class="part">
                <span>{{ item.label }}</span>
                <button type="button" @click="cycleWidget(item.type, -1)"><ChevronLeft :size="16" /></button>
                <strong>{{ shapeLabel(item.type) }}</strong>
                <button type="button" @click="cycleWidget(item.type, 1)"><ChevronRight :size="16" /></button>
              </div>
            </div>
            <div class="block">
              <span>肤色</span>
              <div class="swatches">
                <button
                  v-for="color in SETTINGS.skinColors"
                  :key="color"
                  type="button"
                  class="swatch"
                  :class="{ on: option.widgets.face?.fillColor === color }"
                  :style="{ background: color }"
                  @click="setWidgetColor('face', color)"
                />
              </div>
            </div>
            <div class="block">
              <span>发色</span>
              <div class="swatches">
                <button
                  v-for="color in SETTINGS.commonColors"
                  :key="`hair-${color}`"
                  type="button"
                  class="swatch"
                  :class="{ on: option.widgets.tops?.fillColor === color }"
                  :style="{ background: color }"
                  @click="setWidgetColor('tops', color)"
                />
              </div>
            </div>
            <div class="block">
              <span>衣服</span>
              <div class="swatches">
                <button
                  v-for="color in SETTINGS.commonColors"
                  :key="`clothes-${color}`"
                  type="button"
                  class="swatch"
                  :class="{ on: option.widgets.clothes?.fillColor === color }"
                  :style="{ background: color }"
                  @click="setWidgetColor('clothes', color)"
                />
              </div>
            </div>
            <div class="block">
              <span>背景</span>
              <div class="swatches">
                <button
                  v-for="color in SETTINGS.backgroundColor"
                  :key="color"
                  type="button"
                  class="swatch"
                  :class="{ on: option.background.color === color }"
                  :style="{ background: color === 'transparent' ? '#fff' : color }"
                  @click="setBackground(color)"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="actions">
          <AppButton variant="quiet" type="button" @click="emit('update:open', false)">取消</AppButton>
          <AppButton type="button" :disabled="busy" @click="confirm">用这张</AppButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgb(30 41 59 / 0.28);
}

.content {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 41;
  width: min(820px, calc(100% - 24px));
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding: 18px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hover);
  transform: translate(-50%, -50%);
}

.title {
  margin: 0 0 12px;
  color: var(--heading);
  font-size: 18px;
}

.layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.preview {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.controls {
  display: grid;
  gap: 10px;
  max-height: 62vh;
  overflow: auto;
}

.block,
.part {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.block > span,
.part > span {
  width: 36px;
  color: var(--muted);
  font-size: 13px;
}

.choices {
  display: flex;
  gap: 6px;

  button {
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    background: var(--field);
    color: var(--muted);
    cursor: pointer;

    &.on {
      background: var(--primary-soft);
      color: var(--primary);
      font-weight: 600;
    }
  }
}

.parts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
}

.part {
  button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: var(--field);
    cursor: pointer;
  }

  strong {
    min-width: 56px;
    color: var(--heading);
    font-size: 13px;
    font-weight: 500;
    text-align: center;
  }
}

.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.swatch {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
  cursor: pointer;

  &.on {
    border-color: var(--primary);
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

@media (max-width: 720px) {
  .layout,
  .parts {
    grid-template-columns: 1fr;
  }

  .controls {
    max-height: none;
  }
}
</style>
