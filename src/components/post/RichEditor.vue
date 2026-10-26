<script setup lang="ts">
import { ref } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import { uploadContentImage } from '@/api/post'
import Spinner from '@/components/common/Spinner.vue'
import { pushToast } from '@/composables/useToast'
import { bindWave } from '@/utils/wave'
import { ApiError } from '@/utils/request'

import '@vueup/vue-quill/dist/vue-quill.snow.css'
import '@/assets/styles/editor.scss'

type QuillLike = {
  getSelection: (focus?: boolean) => { index: number } | null
  getLength: () => number
  insertEmbed: (index: number, type: string, value: string, source?: string) => void
  setSelection: (index: number, length: number, source?: string) => void
  getModule: (name: string) => { addHandler: (name: string, handler: () => void) => void }
  root: HTMLElement
}

const model = defineModel<string>({ required: true })
const editor = ref<{ getToolbar: () => HTMLElement; getQuill: () => QuillLike } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const toolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  [{ header: [2, 3, false] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link', 'image'],
  ['clean'],
]

const titles: Record<string, string> = {
  bold: '加粗',
  italic: '斜体',
  underline: '下划线',
  strike: '删除线',
  blockquote: '引用',
  link: '链接',
  image: '图片',
  clean: '清除格式',
  'list:ordered': '有序列表',
  'list:bullet': '无序列表',
}

function localize() {
  const bar = editor.value?.getToolbar()
  if (!bar) return
  bar.querySelectorAll('button, .ql-picker-label, .ql-picker-item').forEach((node) => {
    if (node instanceof HTMLElement) bindWave(node)
    if (!(node instanceof HTMLButtonElement)) return
    const format = [...node.classList].find(
      (name) => name.startsWith('ql-') && name !== 'ql-active',
    )
    if (!format) return
    const name = format.slice(3)
    const value = node.getAttribute('value')
    const title = titles[value ? `${name}:${value}` : name]
    if (title) node.setAttribute('title', title)
  })
  const quill = editor.value?.getQuill()
  if (!quill || quill.root.dataset.imageBound === '1') return
  quill.root.dataset.imageBound = '1'
  quill.getModule('toolbar').addHandler('image', () => fileInput.value?.click())
  quill.root.addEventListener('paste', onPaste)
  bindComposition(quill)
}

function bindComposition(quill: QuillLike) {
  const root = quill.root
  if (root.dataset.imeBound === '1') return
  root.dataset.imeBound = '1'
  const mark = () => {
    root.dataset.composing = '1'
    root.classList.remove('ql-blank')
  }
  const finish = () => {
    delete root.dataset.composing
    queueMicrotask(() => {
      if (root.dataset.composing === '1') return
      const text = (root.textContent || '').replace(/\u200b/g, '').trim()
      root.classList.toggle('ql-blank', text.length === 0)
    })
  }
  root.addEventListener('compositionstart', mark)
  root.addEventListener('compositionupdate', mark)
  root.addEventListener('compositionend', finish)
}

function onPaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  if (!items) return
  const file = Array.from(items)
    .find((item) => item.type.startsWith('image/'))
    ?.getAsFile()
  if (!file) return
  event.preventDefault()
  void insertFile(file)
}

function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void insertFile(file)
}

async function insertFile(file: File) {
  if (uploading.value) return
  const type = file.type.toLowerCase()
  if (type && !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type)) {
    pushToast('只接收 jpg、png、webp', 'error')
    return
  }
  if (file.size > 8 * 1024 * 1024) {
    pushToast('单张图片不能超过 8MB', 'error')
    return
  }
  const quill = editor.value?.getQuill()
  if (!quill) return
  uploading.value = true
  try {
    const saved = await uploadContentImage(file)
    const range = quill.getSelection(true)
    const index = range ? range.index : Math.max(quill.getLength() - 1, 0)
    quill.insertEmbed(index, 'image', saved.url, 'user')
    quill.setSelection(index + 1, 0, 'user')
  } catch (cause) {
    if (!(cause instanceof ApiError)) pushToast('图片没有放进去', 'error')
  } finally {
    uploading.value = false
  }
}

function onUpdate(value: string | null | undefined) {
  model.value = typeof value === 'string' ? value : ''
}
</script>

<template>
  <div class="editor" :aria-busy="uploading || undefined">
    <input
      ref="fileInput"
      class="sr-only"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      tabindex="-1"
      @change="onFile"
    />
    <QuillEditor
      ref="editor"
      :content="model"
      content-type="html"
      theme="snow"
      placeholder="写这一天发生了什么。"
      :toolbar="toolbar"
      @update:content="onUpdate"
      @ready="localize"
    />
    <p v-if="uploading" class="wait" role="status">
      <Spinner />
      正在放入图片
    </p>
  </div>
</template>

<style scoped lang="scss">
.editor {
  position: relative;
}

.wait {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin: 0;
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  color: var(--heading);
}
</style>
