<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueCropper } from 'vue-cropper'
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

import 'vue-cropper/dist/index.css'

const cropperRef = ref<{
  getCropBlob: (callback: (data: Blob | null) => void) => void
  changeScale: (step: number) => void
  rotateLeft: () => void
  rotateRight: () => void
} | null>(null)

const props = withDefaults(
  defineProps<{
    open: boolean
    file: File | null
    loading?: boolean
    title?: string
    outputName?: string
    aspect?: [number, number]
  }>(),
  { loading: false, outputName: 'avatar.jpg', aspect: () => [1, 1] },
)

const { t } = useI18n()
const dialogTitle = computed(() => props.title || t('avatar.crop'))

const cropWidth = computed(() => (props.aspect[0] >= props.aspect[1] ? 320 : 220))
const cropHeight = computed(() => Math.round((cropWidth.value * props.aspect[1]) / props.aspect[0]))
const previewWidth = computed(() => (props.aspect[0] > props.aspect[1] ? 148 : 96))
const previewHeight = computed(() =>
  Math.round((previewWidth.value * props.aspect[1]) / props.aspect[0]),
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [file: File]
}>()

const img = ref('')
const preview = reactive({ url: '', width: 0, height: 0, img: {} as Record<string, string> })

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(t('avatar.readFailed')))
    reader.readAsDataURL(file)
  })
}

function onPreview(data: { url: string; w: number; h: number; img?: Record<string, string> }) {
  preview.url = data.url
  preview.width = data.w
  preview.height = data.h
  preview.img = data.img ?? {}
}

async function confirm() {
  const cropper = cropperRef.value
  if (!cropper) {
    pushToast(t('avatar.cropNotReady'), 'error')
    return
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    cropper.getCropBlob((data) =>
      data ? resolve(data) : reject(new Error(t('avatar.cropFailed'))),
    )
  })
  emit('confirm', new File([blob], props.outputName, { type: blob.type || 'image/jpeg' }))
}

watch(
  () => [props.open, props.file] as const,
  async ([open, file]) => {
    if (!open || !file) {
      img.value = ''
      return
    }
    try {
      img.value = await readAsDataUrl(file)
    } catch {
      pushToast(t('avatar.readFailed'), 'error')
      emit('update:open', false)
    }
  },
)
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent class="content">
        <DialogTitle class="title">{{ dialogTitle }}</DialogTitle>
        <DialogDescription class="sr-only">{{ t('avatar.cropHint') }}</DialogDescription>
        <div class="layout">
          <div class="stage">
            <VueCropper
              v-if="img"
              ref="cropperRef"
              :img="img"
              :auto-crop="true"
              :key="aspect.join('-')"
              :auto-crop-width="cropWidth"
              :auto-crop-height="cropHeight"
              :fixed="true"
              :fixed-number="aspect"
              :center-box="true"
              :can-move="true"
              :can-scale="true"
              :high="true"
              :enlarge="2"
              output-type="jpeg"
              :output-size="0.92"
              fill-color="#ffffff"
              @real-time="onPreview"
            />
          </div>
          <div class="side">
            <div
              class="mask"
              :class="{ wide: aspect[0] > aspect[1] }"
              :style="{ width: `${previewWidth}px`, height: `${previewHeight}px` }"
            >
              <div
                v-if="preview.width"
                class="frame"
                :style="{
                  width: `${preview.width}px`,
                  height: `${preview.height}px`,
                  transform: `scale(${previewWidth / preview.width})`,
                }"
              >
                <img :src="preview.url" :style="preview.img" alt="" />
              </div>
            </div>
            <p>{{ t('avatar.cropHintBody') }}</p>
          </div>
        </div>
        <div class="actions">
          <AppButton variant="quiet" type="button" @click="cropperRef?.changeScale(-1)">{{
            t('action.zoomOut')
          }}</AppButton>
          <AppButton variant="quiet" type="button" @click="cropperRef?.changeScale(1)">{{
            t('action.zoomIn')
          }}</AppButton>
          <AppButton variant="quiet" type="button" @click="cropperRef?.rotateLeft()">{{
            t('avatar.rotate')
          }}</AppButton>
          <AppButton variant="quiet" type="button" @click="emit('update:open', false)">{{
            t('action.cancel')
          }}</AppButton>
          <AppButton type="button" :loading="loading" @click="confirm">{{
            t('avatar.useThis')
          }}</AppButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--scrim);
}

.content {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: calc(var(--z-modal) + 1);
  width: min(720px, calc(100% - 24px));
  padding: var(--space-md);
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hover);
  transform: translate(-50%, -50%);
}

.title {
  margin: 0 0 var(--space-sm);
  color: var(--heading);
  font-size: 18px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: var(--space-md);
}

.stage {
  height: 320px;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--color-ink);
}

.side {
  display: grid;
  justify-items: center;
  gap: var(--space-xs);
  align-content: start;

  p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    text-align: center;
  }
}

.mask {
  overflow: hidden;
  border-radius: 50%;
  background: var(--field);

  &.wide {
    border-radius: 12px;
  }
}

.frame {
  transform-origin: top left;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-xs);
  margin-top: var(--space-md);
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
