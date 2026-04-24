'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { IconChevronDown, IconSelector } from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiUrl } from '@/lib/api-url'

type ProjectTypeRow = {
  slug: string
  projectType: string
  recordsCount: number
}

function SortableHead({
  title,
  sorted,
}: {
  title: string
  sorted: false | 'asc' | 'desc'
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{title}</span>
      {sorted === false ? (
        <IconSelector className="text-muted-foreground/70 size-3.5" stroke={1.75} />
      ) : (
        <IconChevronDown
          className={`size-3.5 transition-transform ${sorted === 'asc' ? 'rotate-180' : ''}`}
          stroke={1.75}
        />
      )}
    </span>
  )
}

export function ProjectsPage() {
  const searchParams = useSearchParams()
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const [rows, setRows] = useState<ProjectTypeRow[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
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

  const totalRecords = useMemo(
    () => rows.reduce((acc, row) => acc + row.recordsCount, 0),
    [rows],
  )

  const columns = useMemo<ColumnDef<ProjectTypeRow>[]>(
    () => [
      {
        accessorKey: 'projectType',
        header: ({ column }) => (
          <button
            type="button"
            className="hover:text-foreground inline-flex items-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            <SortableHead
              title="Тип проекта"
              sorted={column.getIsSorted() as false | 'asc' | 'desc'}
            />
          </button>
        ),
        cell: ({ row }) => (
          <Link
            href={`/projects/${row.original.slug}`}
            className="text-foreground hover:text-primary block truncate font-medium underline-offset-2 hover:underline"
          >
            {row.original.projectType}
          </Link>
        ),
      },
      {
        accessorKey: 'recordsCount',
        header: ({ column }) => (
          <div className="text-right">
            <button
              type="button"
              className="hover:text-foreground inline-flex items-center justify-end"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <SortableHead
                title="Кол-во записей"
                sorted={column.getIsSorted() as false | 'asc' | 'desc'}
              />
            </button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <Badge variant="outline" className="tabular-nums">
              {row.original.recordsCount}
            </Badge>
          </div>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,96rem)] flex-col gap-6 px-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Проекты (Дома)</CardTitle>
          <CardDescription>
            Данные загружаются из Excel-файла `Довозки - перевозки (1).xlsx`.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">Типов: {rows.length}</Badge>
            <Badge variant="outline">Записей: {totalRecords}</Badge>
            {q ? <Badge variant="outline">Фильтр: {q}</Badge> : null}
          </div>
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
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-muted/30">
                    {table.getHeaderGroups().map((headerGroup) =>
                      headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={header.id === 'recordsCount' ? 'text-right' : ''}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      )),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cell.column.id === 'recordsCount' ? 'text-right' : ''}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
