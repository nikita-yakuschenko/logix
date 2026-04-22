'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { apiUrl } from '@/lib/api-url'

type ProjectTypeRow = {
  slug: string
  projectType: string
  recordsCount: number
}

export function ProjectsPage() {
  const searchParams = useSearchParams()
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const [rows, setRows] = useState<ProjectTypeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(apiUrl('/api/project-types'), { signal: ac.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as ProjectTypeRow[]
        if (!ac.signal.aborted) setRows(Array.isArray(data) ? data : [])
      } catch (e) {
        if (ac.signal.aborted) return
        setError(e instanceof Error ? e.message : 'Ошибка загрузки проектов')
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [])

  const filtered = useMemo(() => {
    if (!q) return rows
    return rows.filter((row) => {
      const haystack = [
        row.projectType,
        String(row.recordsCount),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, q])

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,96rem)] flex-col gap-6 px-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Проекты (Дома)</CardTitle>
          <CardDescription>
            Данные загружаются из Excel-файла `Довозки - перевозки (1).xlsx`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Загрузка проектов…</p>
          ) : error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {q ? 'По вашему запросу проекты не найдены.' : 'Нет данных для отображения.'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-border/80 bg-muted/40 border px-3 py-2 text-left font-medium">Тип проекта</th>
                    <th className="border-border/80 bg-muted/40 border px-3 py-2 text-right font-medium">Кол-во записей</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.slug}>
                      <td className="border-border/80 border px-3 py-2 align-top">
                        <Link
                          href={`/projects/${row.slug}`}
                          className="text-foreground hover:text-primary underline-offset-2 hover:underline"
                        >
                          {row.projectType}
                        </Link>
                      </td>
                      <td className="border-border/80 border px-3 py-2 text-right align-top tabular-nums">{row.recordsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
