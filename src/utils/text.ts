import DOMPurify from 'dompurify'

const allowed = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ol', 'ul', 'li', 'a', 'blockquote'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
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
  return plainText(value).length === 0
}

export function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${year}年${Number(month)}月${Number(day)}日`
}

export function formatDateTime(value: string) {
  return value.slice(0, 16).replace('T', ' ')
}
