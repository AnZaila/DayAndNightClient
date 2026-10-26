<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays } from '@lucide/vue'
import { createAnniversary, deleteAnniversary, fetchAnniversaries } from '@/api/anniversary'
import AppButton from '@/components/common/AppButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { Anniversary } from '@/types/anniversary'
import type { Visibility } from '@/types/post'
import { ApiError } from '@/utils/request'
import { pushToast } from '@/composables/useToast'
import { formatDate } from '@/utils/text'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const items = ref<Anniversary[]>([])
const loading = ref(true)
const adding = ref(false)
const error = ref<string | null>(null)
const title = ref('')
const date = ref('')
const note = ref('')
const visibility = ref<Visibility>('PUBLIC')
const pendingId = ref<number | null>(null)

const visibilityOptions = [
  { value: 'PUBLIC' as const, label: '公开' },
  { value: 'PRIVATE' as const, label: '仅双方' },
]

const listed = computed(() =>
  items.value.map((item) => {
    const upcoming = daysUntil(item.date)
    return { ...item, countdown: upcoming.label, days: upcoming.days }
  }),
)

const nextUp = computed(() =>
  listed.value.reduce<(typeof listed.value)[number] | undefined>((soonest, item) => {
    if (item.days === null) return soonest
    if (!soonest || soonest.days === null || item.days < soonest.days) return item
    return soonest
  }, undefined),
)

function daysUntil(value: string) {
  const parts = value.split('-').map(Number)
  const month = parts[1]
  const day = parts[2]
  if (!month || !day) return { days: null, label: '日期还没写全' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let next = new Date(today.getFullYear(), month - 1, day)
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day)
  const days = Math.round((next.getTime() - today.getTime()) / 86400000)
  if (days === 0) return { days, label: '就是今天' }
  return { days, label: `还有 ${days} 天` }
}

async function load() {
  try {
    items.value = await fetchAnniversaries()
  } finally {
    loading.value = false
  }
}

async function add() {
  error.value = null
  if (!title.value.trim()) {
    pushToast('写一个名称', 'error')
    return
  }
  if (!date.value) {
    pushToast('选一个日期', 'error')
    return
  }
  adding.value = true
  try {
    await createAnniversary({
      title: title.value,
      date: date.value,
      repeatYearly: true,
      note: note.value,
      visibility: visibility.value,
    })
    title.value = ''
    date.value = ''
    note.value = ''
    await load()
    pushToast('已记下')
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : '保存失败'
    if (!(cause instanceof ApiError)) pushToast(error.value, 'error')
  } finally {
    adding.value = false
  }
}

function askRemove(id: number) {
  pendingId.value = id
}

function closeConfirm(open: boolean) {
  if (!open) pendingId.value = null
}

async function confirmRemove() {
  const id = pendingId.value
  pendingId.value = null
  if (id == null) return
  await remove(id)
}

async function remove(id: number) {
  await deleteAnniversary(id)
  items.value = items.value.filter((item) => item.id !== id)
  pushToast('已删除')
}

onMounted(load)
</script>

<template>
  <section class="shell stack wide">
    <div class="card">
      <h1 class="page-title">纪念日</h1>
      <p class="lede">每年都会再来的日子。</p>
      <p v-if="nextUp" class="hint">最近的一个是「{{ nextUp.title }}」，{{ nextUp.countdown }}。</p>
      <Skeleton v-if="loading && listed.length === 0" preset="anniversary" :count="3" />
      <p v-else-if="listed.length === 0" class="muted">还没有纪念日。下面可以先记一个。</p>
      <ul v-else>
        <li v-for="item in listed" :key="item.id">
          <div>
            <strong>
              <CalendarDays :size="16" />
              {{ item.title }}
            </strong>
            <p class="muted">{{ formatDate(item.date) }} · {{ item.countdown }}</p>
            <p v-if="item.note">{{ item.note }}</p>
            <p v-if="item.visibility === 'PRIVATE'" class="muted">仅双方可见</p>
          </div>
          <AppButton
            v-if="session.user"
            variant="plain"
            tone="danger"
            type="button"
            @click="askRemove(item.id)"
            >删除</AppButton
          >
        </li>
      </ul>
    </div>
    <form v-if="session.user" class="card" novalidate @submit.prevent="add">
      <h2>记一个新的</h2>
      <label class="field">
        <span>名称</span>
        <input v-model="title" maxlength="40" placeholder="例如：在一起" />
      </label>
      <div class="field">
        <span>日期</span>
        <AppDatePicker v-model="date" />
      </div>
      <label class="field">
        <span>备注</span>
        <input v-model="note" maxlength="200" placeholder="想补充的一句，可以空着" />
      </label>
      <div class="field">
        <span>谁可以看</span>
        <AppSelect v-model="visibility" :options="visibilityOptions" />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <AppButton type="submit" :loading="adding">记下</AppButton>
    </form>
    <p v-else class="card muted">登录之后才能添加或删除纪念日。公开的那些，现在就可以看。</p>
    <ConfirmDialog
      :open="pendingId !== null"
      title="删除这个纪念日？"
      description="删掉之后找不回来。"
      confirm-label="删除"
      tone="danger"
      @update:open="closeConfirm"
      @confirm="confirmRemove"
    />
  </section>
</template>

<style scoped lang="scss">
h2 {
  margin-bottom: 16px;
  color: var(--heading);
  font-size: 22px;
  font-weight: 600;
}

ul {
  display: flex;
  flex-direction: column;
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

@media (max-width: 640px) {
  li {
    flex-direction: column;
    align-items: flex-start;
  }
}

strong {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--heading);
}
</style>
