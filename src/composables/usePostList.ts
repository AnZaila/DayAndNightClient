import { ref } from 'vue'
import { fetchPosts } from '@/api/post'
import type { PostSummary } from '@/types/post'
import { ApiError } from '@/utils/request'

export function usePostList() {
  const posts = ref<PostSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      posts.value = await fetchPosts()
    } catch (cause) {
      error.value = cause instanceof ApiError ? cause.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  return { posts, loading, error, load }
}
