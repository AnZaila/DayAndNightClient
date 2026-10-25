import VWave from 'v-wave'

const { wave } = VWave.createLocalWaveDirective(
  {
    color: 'currentColor',
    initialOpacity: 0.22,
    finalOpacity: 0.08,
    duration: 0.45,
  },
  'vue3',
)

const mounted = (wave as { mounted?: (el: HTMLElement, binding: { value: Record<string, never> }) => void }).mounted

export function bindWave(el: HTMLElement) {
  if (el.dataset.waveBound === '1' || !mounted) return
  el.dataset.waveBound = '1'
  mounted(el, { value: {} })
}
