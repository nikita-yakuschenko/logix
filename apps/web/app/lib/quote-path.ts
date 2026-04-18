/** Сегмент URL карточки расчёта: публичный 6-символьный код, иначе внутренний id (старые ссылки). */
export function quoteDetailPathSegment(q: {
  publicCode?: string | null
  id: string
}): string {
  return q.publicCode?.trim() ? q.publicCode.trim() : q.id
}
