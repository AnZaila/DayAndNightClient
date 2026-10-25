<script setup lang="ts">
import { computed, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  ignore?: HTMLElement | null
}>()

const emit = defineEmits<{
  pick: [emoji: string]
  close: []
}>()

const groups = [
  {
    id: 'face',
    label: '表情',
    items: ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '🥰', '😋', '😜', '🤗', '🤔', '😴', '😭', '😤', '🥺', '😎', '🤩', '😇', '😉', '😌', '😔', '😢', '😡', '🤯', '🥳', '😏', '😳', '🤭', '😺'],
  },
  {
    id: 'heart',
    label: '爱意',
    items: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💌', '💋', '💑', '👫', '💍', '🌹', '🌷', '🌸', '✨'],
  },
  {
    id: 'day',
    label: '日子',
    items: ['☀️', '🌙', '⭐', '🌈', '🍀', '☕', '🍰', '🎂', '🎁', '🎈', '🎉', '🎵', '📚', '🏠', '🚗', '✈️', '📷', '🐱', '🐶', '🐰', '🐻', '🍜', '🍓', '🍫'],
  },
  {
    id: 'hand',
    label: '手势',
    items: ['👍', '👎', '👏', '🙌', '🤝', '🙏', '✌️', '🤞', '💪', '👋', '👌', '🫶', '💋', '💯', '🔥', '🎉'],
  },
]

const active = ref(groups[0]?.id ?? 'face')
const root = ref<HTMLElement | null>(null)
const current = computed(() => groups.find((group) => group.id === active.value)?.items ?? [])
const outsideIgnore = computed(() => (props.ignore ? [props.ignore] : []))

onClickOutside(root, () => emit('close'), { ignore: outsideIgnore })
</script>

<template>
  <div ref="root" class="panel">
    <div class="tabs">
      <button
        v-for="group in groups"
        :key="group.id"
        type="button"
        :class="{ on: active === group.id }"
        @click="active = group.id"
      >
        {{ group.label }}
      </button>
    </div>
    <div class="grid">
      <button
        v-for="emoji in current"
        :key="emoji"
        type="button"
        @mousedown.prevent
        @click="emit('pick', emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel {
  position: absolute;
  z-index: 6;
  right: 0;
  bottom: calc(100% + 8px);
  width: min(320px, 100%);
  padding: 8px;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-hover);
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;

  button {
    min-height: 28px;
    padding: 0 8px;
    border-radius: 999px;
    color: var(--muted);
    cursor: pointer;

    &.on {
      background: var(--primary-soft);
      color: var(--primary);
      font-weight: 600;
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 2px;

  button {
    display: grid;
    place-items: center;
    height: 32px;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;

    &:hover {
      background: var(--field);
    }
  }
}
</style>
