'use client'

/**
 * Иконочные фильтры для списка расчётов: период и авторы.
 * Без фоновых плашек — только чистые иконки с точечным индикатором активного фильтра.
 * Значения живут в URL: ?period=..., ?authors=Имя&authors=Другой.
 */
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { IconCalendar, IconUser } from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useQuotesListFilters } from '@/contexts/quotes-list-filters-context'
import {
  parseQuoteFilters,
  QUOTE_PERIOD_LABEL,
  QUOTE_PERIOD_ORDER,
  type QuotePeriod,
} from '@/lib/quote-filters'
import { cn } from '@/lib/utils'

/** Чистая иконка-триггер без плашки. Активность — только цветом и точкой. */
const triggerClass = cn(
  'relative inline-flex size-8 items-center justify-center rounded-md outline-none transition-colors',
  'text-muted-foreground hover:text-foreground focus-visible:text-foreground',
  'focus-visible:ring-ring focus-visible:ring-2',
  'data-[popup-open]:text-foreground',
  'data-[active=true]:text-foreground',
)

export function QuotesFilters() {
  const [params, setParams] = useSearchParams()
  const { authors: allAuthors } = useQuotesListFilters()

  const filters = useMemo(() => parseQuoteFilters(params), [params])
  const selectedAuthors = filters.authors
  const selectedAuthorsSet = useMemo(
    () => new Set(selectedAuthors),
    [selectedAuthors],
  )

  // Фильтры — push в историю: browser back закрывает фильтр, а не уходит на предыдущую страницу
  const setPeriod = useCallback(
    (next: QuotePeriod) => {
      setParams((prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'all') p.delete('period')
        else p.set('period', next)
        return p
      })
    },
    [setParams],
  )

  const toggleAuthor = useCallback(
    (author: string) => {
      setParams((prev) => {
        const p = new URLSearchParams(prev)
        const current = p.getAll('authors')
        p.delete('authors')
        const isOn = current.includes(author)
        const next = isOn
          ? current.filter((a) => a !== author)
          : [...current, author]
        for (const a of next) p.append('authors', a)
        return p
      })
    },
    [setParams],
  )

  const clearAuthors = useCallback(() => {
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete('authors')
      return p
    })
  }, [setParams])

  const periodActive = filters.period !== 'all'
  const authorsActive = selectedAuthors.length > 0

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {/* Период */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={
                periodActive
                  ? `Период: ${QUOTE_PERIOD_LABEL[filters.period]}`
                  : 'Фильтр по периоду'
              }
              title={
                periodActive
                  ? QUOTE_PERIOD_LABEL[filters.period]
                  : 'Фильтр по периоду'
              }
              data-active={periodActive || undefined}
              className={triggerClass}
            />
          }
        >
          <IconCalendar className="size-[1.15rem]" stroke={1.75} />
          {periodActive && (
            <span
              aria-hidden
              className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full"
            />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Период создания</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={filters.period}
              onValueChange={(v) => setPeriod(v as QuotePeriod)}
            >
              {QUOTE_PERIOD_ORDER.map((p) => (
                <DropdownMenuRadioItem key={p} value={p}>
                  {QUOTE_PERIOD_LABEL[p]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Авторы */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={
                authorsActive
                  ? `Авторы выбраны: ${selectedAuthors.length}`
                  : 'Фильтр по автору'
              }
              title={
                authorsActive
                  ? `Авторы: ${selectedAuthors.join(', ')}`
                  : 'Фильтр по автору'
              }
              data-active={authorsActive || undefined}
              className={triggerClass}
            />
          }
        >
          <IconUser className="size-[1.15rem]" stroke={1.75} />
          {authorsActive && (
            <span
              aria-hidden
              className="bg-primary absolute top-1 right-1 inline-flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none text-primary-foreground"
            >
              {selectedAuthors.length}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="min-w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Автор расчёта</DropdownMenuLabel>
            {allAuthors.length === 0 ? (
              <p className="text-muted-foreground px-2 py-2 text-xs">
                Пока нет расчётов с авторами.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {allAuthors.map((name) => {
                  const checked = selectedAuthorsSet.has(name)
                  return (
                    <DropdownMenuItem
                      key={name}
                      closeOnClick={false}
                      onClick={() => toggleAuthor(name)}
                      className="pr-8"
                    >
                      <span className="truncate">{name}</span>
                      {checked && (
                        <span className="bg-primary ml-auto size-1.5 rounded-full" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </div>
            )}
            {authorsActive && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearAuthors}
                  className="text-muted-foreground"
                >
                  Сбросить выбор
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
