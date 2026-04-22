'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '@/lib/api-url'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatRubAmount } from '@/lib/format-rub'

type ProjectTransportLine = {
  lineNo: string
  vehicleType: string
  rate: string
}

type ProjectRecord = {
  id: string
  contractNumber: string
  houseNumber: string
  projectType: string
  projectClass: string
  address: string
  totalAmount: string
  lines: ProjectTransportLine[]
}

type ProjectTypeDetails = {
  slug: string
  projectType: string
  characteristics: {
    projectClass: string
    standardFleet: string
  }
  records: ProjectRecord[]
}

export function ProjectTypeDetailPage({ slug }: { slug: string }) {
  const [data, setData] = useState<ProjectTypeDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const decodedSlug = (() => {
          try {
            return decodeURIComponent(slug)
          } catch {
            return slug
          }
        })()
        const res = await fetch(
          apiUrl(`/api/project-types/${encodeURIComponent(decodedSlug)}`),
          { signal: ac.signal },
        )
        if (res.status === 404) throw new Error('Тип проекта не найден')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const payload = (await res.json()) as ProjectTypeDetails
        if (!ac.signal.aborted) setData(payload)
      } catch (e) {
        if (ac.signal.aborted) return
        setError(e instanceof Error ? e.message : 'Ошибка загрузки типа проекта')
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [slug])

  const totals = useMemo(() => {
    if (!data) return { amount: '—', average: '—' }
    let sum = 0
    for (const row of data.records) {
      const n = Number(String(row.totalAmount).replace(/\s+/g, '').replace(',', '.'))
      if (Number.isFinite(n)) sum += n
    }
    const avg = data.records.length > 0 ? sum / data.records.length : NaN
    return {
      amount: Number.isFinite(sum) ? formatRubAmount(sum.toFixed(2)) : '—',
      average: Number.isFinite(avg) ? formatRubAmount(avg.toFixed(2)) : '—',
    }
  }, [data])

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,96rem)] flex-col gap-6 px-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle>{data?.projectType ?? 'Тип проекта'}</CardTitle>
          <CardDescription>
            Карточка типа проекта с характеристиками и записями по домам.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Загрузка…</p>
          ) : error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : data ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Класс проекта
                  </p>
                  <p className="mt-1 text-sm">{data.characteristics.projectClass || '—'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Стандартный состав транспорта
                  </p>
                  <p className="mt-1 text-sm">{data.characteristics.standardFleet || '—'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Средняя стоимость транспортировки / сумма
                  </p>
                  <p className="mt-1 text-sm">
                    {totals.average} / {totals.amount}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border-border/80 bg-muted/40 border px-3 py-2 text-left font-medium">№ дома</th>
                      <th className="border-border/80 bg-muted/40 border px-3 py-2 text-left font-medium">№ договора</th>
                      <th className="border-border/80 bg-muted/40 border px-3 py-2 text-left font-medium">Адрес</th>
                      <th className="border-border/80 bg-muted/40 border px-3 py-2 text-left font-medium">Расписание по стоимости</th>
                      <th className="border-border/80 bg-muted/40 border px-3 py-2 text-right font-medium">Итого</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((row) => (
                      <tr key={row.id}>
                        <td className="border-border/80 border px-3 py-2 align-top">{row.houseNumber}</td>
                        <td className="border-border/80 border px-3 py-2 align-top">{row.contractNumber}</td>
                        <td className="border-border/80 border px-3 py-2 align-top">{row.address}</td>
                        <td className="border-border/80 border px-3 py-2 align-top">
                          {row.lines.length === 0
                            ? '—'
                            : row.lines
                                .map((line) => `${line.lineNo} ${line.vehicleType} — ${line.rate}`)
                                .join('; ')}
                        </td>
                        <td className="border-border/80 border px-3 py-2 text-right align-top tabular-nums">{row.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
