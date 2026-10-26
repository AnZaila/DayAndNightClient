import { ref, type Ref } from 'vue'
import type { Page } from '@/types/page'
import { ApiError } from '@/utils/request'

export function usePaged<T>(load: (page: number) => Promise<Page<T>>) {
  const items = ref([]) as Ref<T[]>
  const page = ref(0)
  const total = ref(0)
  const size = ref(0)
  const hasMore = ref(true)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function go(nextPage: number, append: boolean) {
    if (loading.value) return
    if (append && nextPage > 1 && !hasMore.value) return
    loading.value = true
    error.value = null
    try {
      const result = await load(nextPage)
      items.value = append && nextPage > 1 ? [...items.value, ...result.items] : result.items
      page.value = result.page
      total.value = result.total
      size.value = result.size
      hasMore.value = result.hasMore
    } catch (cause) {
      error.value = cause instanceof ApiError ? cause.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  function more() {
    return go(page.value + 1, true)
  }

  function open(nextPage: number) {
    return go(nextPage, false)
  }

  function reset() {
    items.value = []
    page.value = 0
    total.value = 0
    size.value = 0
    hasMore.value = true
    error.value = null
    loading.value = false
  }

  return { items, page, total, size, hasMore, loading, error, more, open, reset }
}
