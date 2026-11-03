<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t, locale } = useI18n()
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

const titles = computed<Record<string, string>>(() => ({
  bold: t('editor.bold'),
  italic: t('editor.italic'),
  underline: t('editor.underline'),
  strike: t('editor.strike'),
  blockquote: t('editor.blockquote'),
  link: t('editor.link'),
  image: t('editor.image'),
  clean: t('editor.clean'),
  'list:ordered': t('editor.ordered'),
  'list:bullet': t('editor.bullet'),
}))

watch(locale, () => localize())

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
    const title = titles.value[value ? `${name}:${value}` : name]
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
    pushToast(t('editor.type'), 'error')
    return
  }
  if (file.size > 8 * 1024 * 1024) {
    pushToast(t('editor.tooBig'), 'error')
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
    if (!(cause instanceof ApiError)) pushToast(t('editor.failed'), 'error')
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
      :placeholder="t('editor.placeholder')"
      :toolbar="toolbar"
      @update:content="onUpdate"
      @ready="localize"
    />
    <p v-if="uploading" class="wait" role="status">
      <Spinner />
      {{ t('editor.uploading') }}
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
  gap: var(--space-xs);
  align-items: center;
  justify-content: center;
  margin: 0;
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  color: var(--heading);
}
</style>
