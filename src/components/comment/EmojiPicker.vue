<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  ignore?: HTMLElement | null
}>()

const emit = defineEmits<{
  pick: [emoji: string]
  close: []
}>()

const { t } = useI18n()

function fromCodePoint(...codes: number[]) {
  return String.fromCodePoint(...codes)
}

const groups = [
  {
    id: 'face',
    items: [
      fromCodePoint(0x1f600),
      fromCodePoint(0x1f601),
      fromCodePoint(0x1f602),
      fromCodePoint(0x1f923),
      fromCodePoint(0x1f60a),
      fromCodePoint(0x1f60d),
      fromCodePoint(0x1f618),
      fromCodePoint(0x1f970),
      fromCodePoint(0x1f60b),
      fromCodePoint(0x1f61c),
      fromCodePoint(0x1f917),
      fromCodePoint(0x1f914),
      fromCodePoint(0x1f634),
      fromCodePoint(0x1f62d),
      fromCodePoint(0x1f624),
      fromCodePoint(0x1f97a),
      fromCodePoint(0x1f60e),
      fromCodePoint(0x1f929),
      fromCodePoint(0x1f607),
      fromCodePoint(0x1f609),
      fromCodePoint(0x1f60c),
      fromCodePoint(0x1f614),
      fromCodePoint(0x1f622),
      fromCodePoint(0x1f621),
      fromCodePoint(0x1f92f),
      fromCodePoint(0x1f973),
      fromCodePoint(0x1f60f),
      fromCodePoint(0x1f633),
      fromCodePoint(0x1f92d),
      fromCodePoint(0x1f63a),
    ],
  },
  {
    id: 'heart',
    items: [
      fromCodePoint(0x2764, 0xfe0f),
      fromCodePoint(0x1f9e1),
      fromCodePoint(0x1f49b),
      fromCodePoint(0x1f49a),
      fromCodePoint(0x1f499),
      fromCodePoint(0x1f49c),
      fromCodePoint(0x1f5a4),
      fromCodePoint(0x1f90d),
      fromCodePoint(0x1f495),
      fromCodePoint(0x1f49e),
      fromCodePoint(0x1f493),
      fromCodePoint(0x1f497),
      fromCodePoint(0x1f496),
      fromCodePoint(0x1f498),
      fromCodePoint(0x1f49d),
      fromCodePoint(0x1f48c),
      fromCodePoint(0x1f48b),
      fromCodePoint(0x1f491),
      fromCodePoint(0x1f46b),
      fromCodePoint(0x1f48d),
      fromCodePoint(0x1f339),
      fromCodePoint(0x1f337),
      fromCodePoint(0x1f338),
      fromCodePoint(0x2728),
    ],
  },
  {
    id: 'day',
    items: [
      fromCodePoint(0x2600, 0xfe0f),
      fromCodePoint(0x1f319),
      fromCodePoint(0x2b50),
      fromCodePoint(0x1f308),
      fromCodePoint(0x1f340),
      fromCodePoint(0x2615),
      fromCodePoint(0x1f370),
      fromCodePoint(0x1f382),
      fromCodePoint(0x1f381),
      fromCodePoint(0x1f388),
      fromCodePoint(0x1f389),
      fromCodePoint(0x1f3b5),
      fromCodePoint(0x1f4da),
      fromCodePoint(0x1f3e0),
      fromCodePoint(0x1f697),
      fromCodePoint(0x2708, 0xfe0f),
      fromCodePoint(0x1f4f7),
      fromCodePoint(0x1f431),
      fromCodePoint(0x1f436),
      fromCodePoint(0x1f430),
      fromCodePoint(0x1f43b),
      fromCodePoint(0x1f35c),
      fromCodePoint(0x1f353),
      fromCodePoint(0x1f36b),
    ],
  },
  {
    id: 'hand',
    items: [
      fromCodePoint(0x1f44d),
      fromCodePoint(0x1f44e),
      fromCodePoint(0x1f44f),
      fromCodePoint(0x1f64c),
      fromCodePoint(0x1f91d),
      fromCodePoint(0x1f64f),
      fromCodePoint(0x270c, 0xfe0f),
      fromCodePoint(0x1f91e),
      fromCodePoint(0x1f4aa),
      fromCodePoint(0x1f44b),
      fromCodePoint(0x1f44c),
      fromCodePoint(0x1faf6),
      fromCodePoint(0x1f48b),
      fromCodePoint(0x1f4af),
      fromCodePoint(0x1f525),
      fromCodePoint(0x1f389),
    ],
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
        {{ t(`emoji.${group.id}`) }}
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
  padding: var(--space-xs);
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-hover);
  transform-origin: 100% 100%;
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity var(--dur-short) var(--ease-out),
    translate var(--dur-short) var(--ease-out),
    scale var(--dur-short) var(--ease-out);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  translate: 0 10px;
  scale: 0.96;
}

.tabs {
  display: flex;
  gap: var(--space-2xs);
  margin-bottom: var(--space-xs);

  button {
    min-height: 28px;
    padding: 0 var(--space-xs);
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
  gap: var(--space-3xs);

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
