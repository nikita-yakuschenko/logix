import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRubAmount } from '@/lib/format-rub'

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

const cell = 'p-2 align-top text-sm leading-normal'

export function QuotesListPage() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [listLoading, setListLoading] = useState(true)

  const loadQuotes = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch('/api/quotes?take=30')
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
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Расчёты</CardTitle>
            <CardDescription>
              {listLoading ? 'Загрузка…' : `${quotes.length} записей`}
            </CardDescription>
          </div>
          <Link
            to="/quotes/new"
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
          >
            Новый расчёт
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className={`${cell} font-medium`}>Дата</th>
                  <th className={`${cell} font-medium max-w-[200px]`}>Куда</th>
                  <th className={`${cell} font-medium`}>Км</th>
                  <th className={`${cell} font-medium`}>Источник</th>
                  <th className={`${cell} font-medium`}>Кто считал</th>
                  <th className={`${cell} text-right font-medium tabular-nums`}>
                    Сумма
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    role="link"
                    tabIndex={0}
                    className="border-border/60 hover:bg-muted/50 cursor-pointer border-b transition-colors"
                    onClick={() => navigate(`/quotes/${q.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/quotes/${q.id}`)
                      }
                    }}
                  >
                    <td className={`${cell} whitespace-nowrap`}>
                      {new Date(q.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td
                      className={`${cell} text-muted-foreground max-w-[200px] truncate`}
                      title={q.destinationAddress ?? ''}
                    >
                      {q.destinationAddress ?? '—'}
                    </td>
                    <td className={`${cell} tabular-nums`}>{q.distanceKm}</td>
                    <td className={cell}>
                      {q.distanceSource === 'MANUAL_OVERRIDE'
                        ? 'вручную'
                        : 'карта'}
                    </td>
                    <td
                      className={`${cell} max-w-[140px] truncate`}
                      title={q.createdBy ?? ''}
                    >
                      {q.createdBy?.trim() ? q.createdBy.trim() : '—'}
                    </td>
                    <td className={`${cell} text-right font-medium tabular-nums`}>
                      {formatRubAmount(q.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!listLoading && quotes.length === 0 && (
              <p className="text-muted-foreground mt-4 text-sm">
                Пока нет сохранённых расчётов. Нажмите «+» в боковой панели или
                кнопку выше.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
