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
    return {
      ...item,
      countdown: upcoming.label,
      days: upcoming.days,
      progress: upcoming.progress,
      weekday: weekdayOf(item.date),
    }
  }),
)

const sorted = computed(() =>
  [...listed.value].sort((a, b) => {
    if (a.days === null) return 1
    if (b.days === null) return -1
    return a.days - b.days
  }),
)

const nextUp = computed(() => sorted.value.find((item) => item.days !== null))

function daysUntil(value: string) {
  const parts = value.split('-').map(Number)
  const month = parts[1]
  const day = parts[2]
  if (!month || !day) return { days: null, label: '日期还没写全', progress: 0 }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let next = new Date(today.getFullYear(), month - 1, day)
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day)
  const days = Math.round((next.getTime() - today.getTime()) / 86400000)
  const progress = Math.min(1, Math.max(0, 1 - days / 365))
  if (days === 0) return { days, label: '就是今天', progress: 1 }
  return { days, label: `还有 ${days} 天`, progress }
}

function weekdayOf(value: string) {
  const parts = value.split('-').map(Number)
  if (!parts[1] || !parts[2]) return ''
  const weekday = new Date(parts[0] ?? 2000, parts[1] - 1, parts[2]).getDay()
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekday] ?? ''
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
  <section class="shell wide">
    <header class="mast">
      <h1 class="page-title">纪念日</h1>
      <p v-if="listed.length" class="count">{{ listed.length }} 个</p>
    </header>

    <Skeleton v-if="loading && listed.length === 0" preset="anniversary" :count="3" />
    <p v-else-if="listed.length === 0" class="muted empty">还没有纪念日。</p>

    <div v-else class="spread">
      <article v-if="nextUp" class="hero">
        <div class="hero-main">
          <p class="hero-label">下一个</p>
          <p class="hero-name">{{ nextUp.title }}</p>
          <p class="hero-date">
            {{ formatDate(nextUp.date) }}
            <span class="dot">·</span>
            {{ nextUp.weekday }}
          </p>
        </div>
        <p class="hero-count">
          <span class="hero-num">{{ nextUp.days }}</span>
          <span class="hero-unit">天</span>
        </p>
        <span class="bar" aria-hidden="true">
          <span class="bar-fill" :style="{ inlineSize: `${nextUp.progress * 100}%` }" />
        </span>
      </article>

      <ul class="rows">
        <li v-for="item in sorted" :key="item.id">
          <span class="glyph"><CalendarDays :size="16" /></span>
          <div class="row-main">
            <p class="row-title">{{ item.title }}</p>
            <p class="row-date">
              {{ formatDate(item.date) }}
              <span class="dot">·</span>
              {{ item.weekday }}
              <span v-if="item.visibility === 'PRIVATE'" class="dot">·</span>
              <span v-if="item.visibility === 'PRIVATE'">仅双方</span>
            </p>
            <p v-if="item.note" class="row-note">{{ item.note }}</p>
          </div>
          <span class="chip" :class="{ today: item.days === 0 }">{{ item.countdown }}</span>
          <AppButton
            v-if="session.user"
            class="drop"
            variant="quiet"
            tone="danger"
            type="button"
            @click="askRemove(item.id)"
            >删除</AppButton
          >
        </li>
      </ul>
    </div>

    <form v-if="session.user" class="card composer" novalidate @submit.prevent="add">
      <h2>记一个新的</h2>
      <div class="grid">
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
          <input v-model="note" maxlength="200" placeholder="可以空着" />
        </label>
        <div class="field">
          <span>谁可以看</span>
          <AppSelect v-model="visibility" :options="visibilityOptions" />
        </div>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <AppButton type="submit" :loading="adding">记下</AppButton>
    </form>

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
.mast {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);

  .page-title {
    margin: 0;
  }
}

.count {
  margin: 0;
  color: var(--muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.empty {
  padding: var(--space-lg) 0;
}

.spread {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-xs) var(--space-md);
  align-items: end;
  padding: var(--space-md) var(--space-lg);
  overflow: hidden;
  background: linear-gradient(
    120deg,
    color-mix(in oklab, var(--primary) 12%, var(--surface)),
    var(--surface) 58%
  );
  border: var(--rule-hair) solid color-mix(in oklab, var(--primary) 22%, var(--line));
  border-radius: var(--radius-lg);
}

.hero-main {
  min-width: 0;
}

.hero-label {
  margin: 0 0 var(--space-3xs);
  color: var(--primary);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
}

.hero-name {
  margin: 0;
  color: var(--heading);
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  line-height: 1.15;
}

.hero-count {
  display: flex;
  align-items: baseline;
  gap: var(--space-2xs);
  margin: 0;
  color: var(--heading);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  line-height: 0.85;
}

.hero-num {
  font-size: clamp(52px, 6vw, 76px);
  letter-spacing: -0.02em;
}

.hero-unit {
  color: var(--muted);
  font-size: var(--text-lg);
}

.hero-date {
  margin: var(--space-2xs) 0 0;
  color: var(--muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.bar {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: block;
  height: 3px;
  overflow: hidden;
  background: color-mix(in oklab, var(--primary) 10%, transparent);
}

.bar-fill {
  display: block;
  height: 100%;
  background: color-mix(in oklab, var(--primary) 72%, transparent);
  border-radius: inherit;
  transition: inline-size var(--dur-long) var(--ease-out);
}

.rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--surface);
  border: var(--rule-hair) solid var(--line);
  border-radius: var(--radius-lg);
}

li {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);

  & + li {
    border-top: var(--rule-hair) solid var(--line);
  }
}

.glyph {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  background: var(--primary-soft);
  border-radius: var(--radius);
  color: var(--primary);
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-title {
  margin: 0;
  color: var(--heading);
  font-weight: 500;
}

.row-date {
  margin: 0;
  color: var(--muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.row-note {
  margin: var(--space-3xs) 0 0;
  color: var(--muted);
  font-size: var(--text-sm);
}

.dot {
  margin: 0 0.15em;
  color: var(--faint);
}

.chip {
  flex: none;
  padding: var(--space-3xs) var(--space-xs);
  background: var(--field);
  border-radius: var(--radius-pill);
  color: var(--muted);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &.today {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 600;
  }
}

.drop {
  flex: none;
  opacity: 0;
  transition: opacity var(--dur-short) var(--ease-out);
}

li:hover .drop,
.drop:focus-visible {
  opacity: 1;
}

.composer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
}

h2 {
  margin: 0;
  color: var(--heading);
  font-size: var(--text-lg);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-sm);
  width: 100%;

  .field {
    margin: 0;
  }
}

@media (max-width: 640px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    padding: var(--space-md);
  }

  .hero-count {
    justify-content: flex-end;
  }

  .drop {
    opacity: 1;
  }
}
</style>
