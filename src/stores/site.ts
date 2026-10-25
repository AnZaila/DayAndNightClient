import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSite } from '@/api/site'
import type { Site } from '@/types/site'

export const useSiteStore = defineStore('site', () => {
  const site = ref<Site | null>(null)

  async function load() {
    site.value = await fetchSite()
  }

  return { site, load }
})
