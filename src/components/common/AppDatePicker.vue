<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'
import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date'
import {
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'reka-ui'

const { t, locale } = useI18n()
const months = computed(() =>
  Array.from({ length: 12 }, (_, index) => t(`date.month.${index + 1}`)),
)

const model = defineModel<string>({ required: true })
const open = ref(false)
const view = ref<'day' | 'month' | 'year'>('day')

const date = computed<DateValue | undefined>({
  get() {
    if (!model.value) return undefined
    try {
      return parseDate(model.value)
    } catch {
      return undefined
    }
  },
  set(value) {
    model.value = value ? value.toString() : ''
  },
})

const placeholder = ref<DateValue>(date.value ?? today(getLocalTimeZone()))

const label = computed(() => {
  const value = date.value
  if (!value) return t('date.pick')
  return t('date.ymd', { y: value.year, m: value.month, d: value.day })
})

const decadeStart = computed(() => Math.floor(placeholder.value.year / 10) * 10)

const years = computed(() => Array.from({ length: 12 }, (_, index) => decadeStart.value + index))

const headingText = computed(() => {
  const value = placeholder.value
  if (view.value === 'year') return `${decadeStart.value}–${decadeStart.value + 9}`
  if (view.value === 'month') return t('date.yearOnly', { y: value.year })
  return t('date.ym', { y: value.year, m: value.month })
})

watch(open, (value) => {
  if (!value) view.value = 'day'
})

function stepYear(cursor: DateValue) {
  return view.value === 'year' ? cursor.subtract({ years: 10 }) : cursor.subtract({ years: 1 })
}

function stepYearForward(cursor: DateValue) {
  return view.value === 'year' ? cursor.add({ years: 10 }) : cursor.add({ years: 1 })
}

function liftView() {
  if (view.value === 'day') view.value = 'month'
  else if (view.value === 'month') view.value = 'year'
}

function pickMonth(month: number) {
  placeholder.value = placeholder.value.set({ month })
  view.value = 'day'
}

function pickYear(year: number) {
  placeholder.value = placeholder.value.set({ year })
  view.value = 'month'
}
</script>

<template>
  <div class="picker">
    <DatePickerRoot
      v-model="date"
      v-model:placeholder="placeholder"
      v-model:open="open"
      :locale="locale"
      :week-starts-on="1"
      prevent-deselect
      close-on-select
    >
      <DatePickerTrigger as-child>
        <button type="button" class="soft-trigger" :data-empty="model ? undefined : ''">
          <span class="soft-value">{{ label }}</span>
          <svg class="soft-chevron" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2.5" y="3.5" width="11" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </DatePickerTrigger>
      <DatePickerContent class="soft-calendar" side="bottom" align="start" :side-offset="8">
        <DatePickerCalendar v-slot="{ weekDays, grid }">
          <DatePickerHeader class="soft-cal-header">
            <DatePickerPrev as-child :prev-page="stepYear">
              <button type="button" class="soft-cal-nav" :aria-label="t('date.prevYear')">
                <ChevronsLeft :size="16" />
              </button>
            </DatePickerPrev>
            <DatePickerPrev v-if="view === 'day'" as-child>
              <button type="button" class="soft-cal-nav" :aria-label="t('date.prevMonth')">
                <ChevronLeft :size="16" />
              </button>
            </DatePickerPrev>
            <DatePickerHeading class="sr-only" />
            <button
              type="button"
              class="soft-cal-heading"
              :disabled="view === 'year'"
              :aria-label="view === 'day' ? t('date.pickMonth') : t('date.pickYear')"
              @click="liftView"
            >
              {{ headingText }}
            </button>
            <DatePickerNext v-if="view === 'day'" as-child>
              <button type="button" class="soft-cal-nav" :aria-label="t('date.nextMonth')">
                <ChevronRight :size="16" />
              </button>
            </DatePickerNext>
            <DatePickerNext as-child :next-page="stepYearForward">
              <button type="button" class="soft-cal-nav" :aria-label="t('date.nextYear')">
                <ChevronsRight :size="16" />
              </button>
            </DatePickerNext>
          </DatePickerHeader>
          <template v-if="view === 'day'">
            <DatePickerGrid v-for="month in grid" :key="month.value.toString()">
              <DatePickerGridHead>
                <DatePickerGridRow>
                  <DatePickerHeadCell v-for="day in weekDays" :key="day">{{ day }}</DatePickerHeadCell>
                </DatePickerGridRow>
              </DatePickerGridHead>
              <DatePickerGridBody>
                <DatePickerGridRow v-for="(week, index) in month.rows" :key="`${month.value.toString()}-${index}`">
                  <DatePickerCell v-for="day in week" :key="day.toString()" :date="day">
                    <DatePickerCellTrigger as-child :day="day" :month="month.value">
                      <button type="button" class="soft-cal-day">{{ day.day }}</button>
                    </DatePickerCellTrigger>
                  </DatePickerCell>
                </DatePickerGridRow>
              </DatePickerGridBody>
            </DatePickerGrid>
          </template>
          <div v-else-if="view === 'month'" class="soft-cal-pick">
            <button
              v-for="(name, index) in months"
              :key="name"
              type="button"
              class="soft-cal-chip"
              :data-selected="date?.year === placeholder.year && date?.month === index + 1 ? '' : undefined"
              @click="pickMonth(index + 1)"
            >
              {{ name }}
            </button>
          </div>
          <div v-else class="soft-cal-pick">
            <button
              v-for="year in years"
              :key="year"
              type="button"
              class="soft-cal-chip"
              :data-outside="year > decadeStart + 9 ? '' : undefined"
              :data-selected="date?.year === year ? '' : undefined"
              @click="pickYear(year)"
            >
              {{ year }}
            </button>
          </div>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>
  </div>
</template>

<style scoped lang="scss">
.picker {
  position: relative;
  width: 100%;
  min-width: 0;
}
</style>
