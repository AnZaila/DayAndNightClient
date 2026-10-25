<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  total: number
  size: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  page: [page: number]
}>()

const pages = computed(() => Math.max(1, Math.ceil(props.total / Math.max(props.size, 1))))
</script>

<template>
  <nav v-if="total > size" class="pager" aria-label="分页">
    <button v-wave type="button" :disabled="disabled || page <= 1" @click="emit('page', page - 1)">
      上一页
    </button>
    <span>{{ page }} / {{ pages }}</span>
    <button
      v-wave
      type="button"
      :disabled="disabled || page >= pages"
      @click="emit('page', page + 1)"
    >
      下一页
    </button>
  </nav>
</template>

<style scoped lang="scss">
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;

  button {
    min-height: 34px;
    padding: 0 12px;
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
