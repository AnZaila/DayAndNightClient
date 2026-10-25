import DOMPurify from 'dompurify'

const allowed = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'h2',
    'h3',
    'ol',
    'ul',
    'li',
    'a',
    'blockquote',
    'img',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt'],
}

export function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function looksLikeHtml(value: string) {
  return /<\/?[a-z][^>]*>/i.test(value)
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function toEditorHtml(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (looksLikeHtml(trimmed)) return trimmed
  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function renderHtml(value: string) {
  return DOMPurify.sanitize(toEditorHtml(value), allowed)
}

export function isBlankHtml(value: string) {
  if (/<img\b/i.test(value)) return false
  return plainText(value).length === 0
}

function dateParts(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (!match) return null
  return {
    year: match[1],
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4],
    minute: match[5],
    second: match[6] ?? (match[4] ? '00' : undefined),
  }
}

export function formatDate(value: string) {
  const part = dateParts(value)
  if (!part) return value
  const day = `${part.year}年${part.month}月${part.day}日`
  if (!part.hour || !part.minute || part.second == null) return day
  return `${day} ${part.hour}:${part.minute}:${part.second}`
}

export function formatMonthDay(value: string) {
  const part = dateParts(value)
  if (!part) return value
  return `${part.month}月${part.day}日`
}

export function formatDateTime(value: string) {
  const part = dateParts(value)
  if (!part) return value
  const day = `${part.year}-${String(part.month).padStart(2, '0')}-${String(part.day).padStart(2, '0')}`
  if (!part.hour || !part.minute || part.second == null) return day
  return `${day} ${part.hour}:${part.minute}:${part.second}`
}
