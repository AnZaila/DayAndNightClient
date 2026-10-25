<script setup lang="ts">
import { ref } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'

import '@vueup/vue-quill/dist/vue-quill.snow.css'
import '@/assets/styles/editor.scss'

const model = defineModel<string>({ required: true })
const editor = ref<{ getToolbar: () => HTMLElement } | null>(null)

const toolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  [{ header: [2, 3, false] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  ['clean'],
]

const titles: Record<string, string> = {
  bold: '加粗',
  italic: '斜体',
  underline: '下划线',
  strike: '删除线',
  blockquote: '引用',
  link: '链接',
  clean: '清除格式',
  'list:ordered': '有序列表',
  'list:bullet': '无序列表',
}

function localize() {
  const bar = editor.value?.getToolbar()
  if (!bar) return
  bar.querySelectorAll('button').forEach((button) => {
    const format = [...button.classList].find((name) => name.startsWith('ql-') && name !== 'ql-active')
    if (!format) return
    const name = format.slice(3)
    const value = button.getAttribute('value')
    const title = titles[value ? `${name}:${value}` : name]
    if (title) button.setAttribute('title', title)
  })
}

function onUpdate(value: string | null | undefined) {
  model.value = typeof value === 'string' ? value : ''
}
</script>

<template>
  <div class="editor">
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
  </div>
</template>
