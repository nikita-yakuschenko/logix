'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiUrl } from '@/lib/api-url'
import { QuoteNumberCopyCell } from '@/components/quote-number-copy-cell'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuotesListFilters } from '@/contexts/quotes-list-filters-context'
import { formatObjectAddressLabel } from '@/lib/format-address-lines'
import {
  applyQuoteFilters,
  hasActiveQuoteFilters,
  parseQuoteFilters,
} from '@/lib/quote-filters'
import { quoteDetailPathSegment } from '@/lib/quote-path'
import { cn } from '@/lib/utils'
import { formatDistanceKm } from '@/lib/format-km'
import { formatRubAmount } from '@/lib/format-rub'
import { DEFAULT_DISPLAY_NAME } from '@/settings/types'

const SKELETON_ROW_COUNT = 8
/** Видимая ширина колонки «адрес» — ~70 знаков в единицах `ch`, без сокращения до порога; длиннее — ellipsis + title */
const ADDRESS_COL_MAX_CH = 70

type QuoteRow = {
  id: string
  publicCode?: string | null
  depotName?: string
  destinationAddress: string | null
  distanceKm: number
  total: string
  currency: string
  createdAt: string
  createdBy: string | null
}

// align-middle + фикс h-11: одна высота строк в thead/tbody, без скачка скелетон → данные
const cell = 'p-2 align-middle text-sm leading-normal'
const rowH = 'h-11 border-border/60 border-b'
// высота полосы ≈ line-height у text-sm/leading-normal (1.5×14px)
const skLine = 'h-[1.3125rem]'

/** Дата для списка — только календарная, без времени (в БД по-прежнему полный ISO). */
function formatQuoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU')
}

/** Фиксированные доли колонок (сумма 100%) — ширина не зависит от содержимого страницы / скелетона. */
function QuotesTableColgroup() {
  return (
    <colgroup>
      <col className="w-[8%]" />
      <col className="w-[11%]" />
      <col className="w-[33%] min-w-[70ch]" />
      <col className="w-[10%]" />
      <col className="w-[20%]" />
      <col className="w-[18%]" />
    </colgroup>
  )
}

export function QuotesListPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [listLoading, setListLoading] = useState(true)
  const searchParams = useSearchParams()
  const rawSearchTerm = (searchParams.get('q') ?? '').trim()
  const searchTerm = rawSearchTerm.toLowerCase()
  const { setAuthors } = useQuotesListFilters()

  const filters = useMemo(() => parseQuoteFilters(searchParams), [searchParams])
  const filtersActive = hasActiveQuoteFilters(filters)

  const loadQuotes = useCallback(async (signal: AbortSignal) => {
    setListLoading(true)
    try {
      const res = await fetch(apiUrl('/api/quotes?take=100'), { signal })
      if (!res.ok) throw new Error(`quotes ${res.status}`)
      setQuotes(await res.json())
    } catch {
      /* сеть / 5xx: список не трогаем; отмена запроса — тоже */
    } finally {
      if (!signal.aborted) setListLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    void loadQuotes(ac.signal)
    return () => ac.abort()
  }, [loadQuotes])

  // Пушим уникальных авторов в контекст — шапка использует это для dropdown фильтра
  useEffect(() => {
    setAuthors(quotes.map((q) => q.createdBy ?? '').filter(Boolean))
  }, [quotes, setAuthors])

  // Сначала — фильтры (период + авторы), потом — полнотекстовый поиск
  const visibleQuotes = useMemo(() => {
    const filtered = applyQuoteFilters(quotes, filters)
    if (!searchTerm) return filtered
    return filtered.filter((q) => {
      const address = formatObjectAddressLabel(q.destinationAddress).toLowerCase()
      const code = (q.publicCode ?? '').toLowerCase()
      const author = (q.createdBy ?? '').toLowerCase()
      const date = formatQuoteDate(q.createdAt).toLowerCase()
      return (
        code.includes(searchTerm) ||
        address.includes(searchTerm) ||
        author.includes(searchTerm) ||
        date.includes(searchTerm)
      )
    })
  }, [quotes, filters, searchTerm])

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,96rem)] flex-col gap-6 px-6 py-6">
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table
              className="w-full table-fixed border-collapse text-left text-sm"
              aria-busy={listLoading}
            >
              <QuotesTableColgroup />
              <thead>
                <tr className={rowH}>
                  <th className={`${cell} font-medium`}>Дата</th>
                  <th className={`${cell} font-medium`} title="Номер расчёта">
                    Номер
                  </th>
                  <th className={`${cell} font-medium`}>Адрес объекта</th>
                  <th className={`${cell} font-medium`}>Расстояние</th>
                  <th className={`${cell} font-medium`}>Ответственный</th>
                  <th className={`${cell} text-right font-medium tabular-nums`}>
                    Сумма
                  </th>
                </tr>
              </thead>
              <tbody>
                {listLoading
                  ? Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
                      <tr key={`sk-${i}`} className={rowH}>
                        <td className={cell}>
                          <Skeleton className={`${skLine} w-full`} />
                        </td>
                        <td className={cell}>
                          <div className="inline-flex items-center gap-0">
                            <Skeleton className={`${skLine} w-[7ch] shrink-0`} />
                            <Skeleton className="size-5 shrink-0 rounded-sm" />
                          </div>
                        </td>
                        <td className={`${cell} min-w-0`}>
                          <Skeleton className={`${skLine} w-full`} />
                        </td>
                        <td className={cell}>
                          <Skeleton className={`${skLine} w-full`} />
                        </td>
                        <td className={`${cell} min-w-0`}>
                          <Skeleton className={`${skLine} w-full`} />
                        </td>
                        <td className={`${cell} text-right`}>
                          <div className="flex justify-end">
                            <Skeleton className={`${skLine} w-21`} />
                          </div>
                        </td>
                      </tr>
                    ))
                  : visibleQuotes.map((q) => {
                      const objectAddress = formatObjectAddressLabel(
                        q.destinationAddress,
                      )
                      return (
                      <tr
                        key={q.id}
                        role="link"
                        tabIndex={0}
                        className={`${rowH} hover:bg-muted/50 cursor-pointer transition-colors`}
                        onClick={() =>
                          router.push(`/quotes/${quoteDetailPathSegment(q)}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            router.push(`/quotes/${quoteDetailPathSegment(q)}`)
                          }
                        }}
                      >
                        <td className={`${cell} whitespace-nowrap`}>
                          {formatQuoteDate(q.createdAt)}
                        </td>
                        <td className={cn(cell, 'whitespace-nowrap')}>
                          <QuoteNumberCopyCell quote={q} />
                        </td>
                        <td
                          className={cn(
                            cell,
                            'text-muted-foreground min-w-0 truncate',
                            `max-w-[${ADDRESS_COL_MAX_CH}ch]`,
                          )}
                          title={
                            q.destinationAddress ? objectAddress : ''
                          }
                        >
                          {objectAddress}
                        </td>
                        <td className={`${cell} tabular-nums`}>
                          {formatDistanceKm(q.distanceKm)}
                        </td>
                        <td
                          className={cn(cell, 'min-w-0 truncate')}
                          title={q.createdBy?.trim() || DEFAULT_DISPLAY_NAME}
                        >
                          {q.createdBy?.trim() || DEFAULT_DISPLAY_NAME}
                        </td>
                        <td
                          className={`${cell} text-right font-medium tabular-nums`}
                        >
                          {formatRubAmount(q.total)}
                        </td>
                      </tr>
                      )
                    })}
              </tbody>
            </table>
            {!listLoading && quotes.length === 0 && (
              <p className="text-muted-foreground mt-4 text-sm">
                Пока нет сохранённых расчётов. Нажмите «+» в боковой панели или
                «Новый расчёт» в шапке справа.
              </p>
            )}
            {!listLoading &&
              quotes.length > 0 &&
              visibleQuotes.length === 0 && (
                <p className="text-muted-foreground mt-4 text-sm">
                  {rawSearchTerm
                    ? `По запросу «${rawSearchTerm}» ничего не найдено.`
                    : filtersActive
                      ? 'Под выбранные фильтры ничего не подходит.'
                      : 'Ничего не найдено.'}
                </p>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
