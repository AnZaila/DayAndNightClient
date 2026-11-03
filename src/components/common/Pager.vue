<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  page: number
  total: number
  size: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  page: [page: number]
}>()

const { t } = useI18n()
const pages = computed(() => Math.max(1, Math.ceil(props.total / Math.max(props.size, 1))))
</script>

<template>
  <nav v-if="total > size" class="pager" :aria-label="t('pager.label')">
    <button v-wave type="button" :disabled="disabled || page <= 1" @click="emit('page', page - 1)">
      {{ t('pager.prev') }}
    </button>
    <span>{{ page }} / {{ pages }}</span>
    <button
      v-wave
      type="button"
      :disabled="disabled || page >= pages"
      @click="emit('page', page + 1)"
    >
      {{ t('pager.next') }}
    </button>
  </nav>
</template>

<style scoped lang="scss">
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);

  button {
    min-height: 34px;
    padding: 0 var(--space-sm);
    border-radius: 999px;
    background: var(--field);
    color: var(--heading);
    cursor: pointer;

    &:disabled {
      color: var(--faint);
      cursor: default;
    }
  }

  span {
    color: var(--muted);
    font-size: 13px;
  }
}
</style>
