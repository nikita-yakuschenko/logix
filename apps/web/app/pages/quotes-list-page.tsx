import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { apiUrl } from '@/lib/api-url'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatRubAmount } from '@/lib/format-rub'

const SKELETON_ROW_COUNT = 8

type QuoteRow = {
  id: string
  depotName?: string
  destinationAddress: string | null
  distanceKm: number
  distanceSource: string
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
      <col className="w-[10%]" />
      <col className="w-[34%]" />
      <col className="w-[9%]" />
      <col className="w-[11%]" />
      <col className="w-[18%]" />
      <col className="w-[18%]" />
    </colgroup>
  )
}

export function QuotesListPage() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [listLoading, setListLoading] = useState(true)

  const loadQuotes = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch(apiUrl('/api/quotes?take=30'))
      if (!res.ok) throw new Error(`quotes ${res.status}`)
      setQuotes(await res.json())
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQuotes()
  }, [loadQuotes])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-6">
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
                  <th className={`${cell} font-medium`}>Куда</th>
                  <th className={`${cell} font-medium`}>Км</th>
                  <th className={`${cell} font-medium`}>Источник</th>
                  <th className={`${cell} font-medium`}>Кто считал</th>
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
                        <td className={`${cell} min-w-0`}>
                          <Skeleton className={`${skLine} w-full`} />
                        </td>
                        <td className={cell}>
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
                            <Skeleton className={`${skLine} w-[5.25rem]`} />
                          </div>
                        </td>
                      </tr>
                    ))
                  : quotes.map((q) => (
                      <tr
                        key={q.id}
                        role="link"
                        tabIndex={0}
                        className={`${rowH} hover:bg-muted/50 cursor-pointer transition-colors`}
                        onClick={() => navigate(`/quotes/${q.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(`/quotes/${q.id}`)
                          }
                        }}
                      >
                        <td className={`${cell} whitespace-nowrap`}>
                          {formatQuoteDate(q.createdAt)}
                        </td>
                        <td
                          className={cn(
                            cell,
                            'text-muted-foreground min-w-0 truncate',
                          )}
                          title={q.destinationAddress ?? ''}
                        >
                          {q.destinationAddress ?? '—'}
                        </td>
                        <td className={`${cell} tabular-nums`}>
                          {q.distanceKm}
                        </td>
                        <td className={cell}>
                          {q.distanceSource === 'MANUAL_OVERRIDE'
                            ? 'вручную'
                            : 'карта'}
                        </td>
                        <td
                          className={cn(cell, 'min-w-0 truncate')}
                          title={q.createdBy ?? ''}
                        >
                          {q.createdBy?.trim() ? q.createdBy.trim() : '—'}
                        </td>
                        <td
                          className={`${cell} text-right font-medium tabular-nums`}
                        >
                          {formatRubAmount(q.total)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!listLoading && quotes.length === 0 && (
              <p className="text-muted-foreground mt-4 text-sm">
                Пока нет сохранённых расчётов. Нажмите «+» в боковой панели или
                «Новый расчёт» в шапке справа.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
