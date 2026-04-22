/**
 * Утилиты для фильтров списка расчётов: период создания и авторы.
 * Парсятся из URL (`useSearchParams`) и применяются к массиву расчётов.
 */

export type QuotePeriod =
  | 'all'
  | 'today'
  | '7d'
  | '30d'
  | 'month'
  | 'prev_month'

export const QUOTE_PERIOD_LABEL: Record<QuotePeriod, string> = {
  all: 'За всё время',
  today: 'Сегодня',
  '7d': 'Последние 7 дней',
  '30d': 'Последние 30 дней',
  month: 'Этот месяц',
  prev_month: 'Прошлый месяц',
}

export const QUOTE_PERIOD_ORDER: QuotePeriod[] = [
  'all',
  'today',
  '7d',
  '30d',
  'month',
  'prev_month',
]

export type QuoteFilters = {
  period: QuotePeriod
  authors: string[]
}

const VALID_PERIODS = new Set<QuotePeriod>(QUOTE_PERIOD_ORDER)

export function parseQuoteFilters(params: URLSearchParams): QuoteFilters {
  const raw = params.get('period')
  const period: QuotePeriod = raw && VALID_PERIODS.has(raw as QuotePeriod)
    ? (raw as QuotePeriod)
    : 'all'
  const authors = params
    .getAll('authors')
    .map((a) => a.trim())
    .filter(Boolean)
  return { period, authors }
}

/** Работает на ISO-строках; границы включительно слева, исключительно справа. */
function matchesPeriod(createdAtIso: string, period: QuotePeriod, now: Date): boolean {
  if (period === 'all') return true
  const d = new Date(createdAtIso)
  if (Number.isNaN(d.getTime())) return false

  if (period === 'today') {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return d >= from
  }
  if (period === '7d') {
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= from
  }
  if (period === '30d') {
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return d >= from
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return d >= from
  }
  if (period === 'prev_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 1)
    return d >= from && d < to
  }
  return true
}

export type QuoteForFilter = {
  createdAt: string
  createdBy: string | null
}

export function applyQuoteFilters<T extends QuoteForFilter>(
  quotes: T[],
  filters: QuoteFilters,
  now: Date = new Date(),
): T[] {
  const authorsSet = filters.authors.length
    ? new Set(filters.authors.map((a) => a.toLowerCase()))
    : null

  return quotes.filter((q) => {
    if (!matchesPeriod(q.createdAt, filters.period, now)) return false
    if (authorsSet) {
      const who = (q.createdBy ?? '').trim().toLowerCase()
      if (!who || !authorsSet.has(who)) return false
    }
    return true
  })
}

export function hasActiveQuoteFilters(filters: QuoteFilters): boolean {
  return filters.period !== 'all' || filters.authors.length > 0
}

export function countActiveQuoteFilters(filters: QuoteFilters): number {
  let n = 0
  if (filters.period !== 'all') n += 1
  if (filters.authors.length > 0) n += 1
  return n
}
