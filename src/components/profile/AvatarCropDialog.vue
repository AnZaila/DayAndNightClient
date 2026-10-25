<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
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
  }>(),
  { loading: false },
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
    reader.onerror = () => reject(new Error('图片读取失败'))
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
    pushToast('裁剪还没准备好', 'error')
    return
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    cropper.getCropBlob((data) => (data ? resolve(data) : reject(new Error('裁剪失败'))))
  })
  emit('confirm', new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' }))
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
      pushToast('图片读取失败', 'error')
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
        <DialogTitle class="title">裁剪头像</DialogTitle>
        <DialogDescription class="sr-only">拖动或缩放，裁成正方形。</DialogDescription>
        <div class="layout">
          <div class="stage">
            <VueCropper
              v-if="img"
              ref="cropperRef"
              :img="img"
              :auto-crop="true"
              :auto-crop-width="220"
              :auto-crop-height="220"
              :fixed="true"
              :fixed-number="[1, 1]"
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
            <div class="mask">
              <div
                v-if="preview.width"
                class="frame"
                :style="{
                  width: `${preview.width}px`,
                  height: `${preview.height}px`,
                  transform: `scale(${96 / preview.width})`,
                }"
              >
                <img :src="preview.url" :style="preview.img" alt="" />
              </div>
            </div>
            <p>拖动图片，滚轮缩放。</p>
          </div>
        </div>
        <div class="actions">
          <AppButton variant="quiet" type="button" @click="cropperRef?.changeScale(-1)">缩小</AppButton>
          <AppButton variant="quiet" type="button" @click="cropperRef?.changeScale(1)">放大</AppButton>
          <AppButton variant="quiet" type="button" @click="cropperRef?.rotateLeft()">左转</AppButton>
          <AppButton variant="quiet" type="button" @click="emit('update:open', false)">取消</AppButton>
          <AppButton type="button" :disabled="loading" @click="confirm">用这张</AppButton>
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
  width: min(720px, calc(100% - 24px));
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
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 14px;
}

.stage {
  height: 320px;
  overflow: hidden;
  border-radius: var(--radius);
  background: #111827;
}

.side {
  display: grid;
  justify-items: center;
  gap: 8px;
  align-content: start;

  p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    text-align: center;
  }
}

.mask {
  width: 96px;
  height: 96px;
  overflow: hidden;
  border-radius: 22%;
  background: var(--field);
}

.frame {
  transform-origin: top left;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
