'use client'

/**
 * Контекст списка расчётов — канал данных между страницей списка (заполняет)
 * и шапкой/фильтрами (читают уникальных авторов для UI мультиселекта).
 * Провайдер монтируется один раз на уровне Shell; без сетевых запросов.
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AuthorInfo = {
  /** Все уникальные непустые авторы, отсортированные по алфавиту RU. */
  authors: string[]
  /** Передаёт страница после загрузки данных. */
  setAuthors: (authors: string[]) => void
}

const QuotesListFiltersContext = createContext<AuthorInfo | null>(null)

export function QuotesListFiltersProvider({
  children,
}: {
  children: ReactNode
}) {
  const [authors, setAuthorsState] = useState<string[]>([])
  const value = useMemo<AuthorInfo>(
    () => ({
      authors,
      setAuthors: (next) => {
        // идемпотентная установка: сортируем и дедуплицируем
        const cleaned = Array.from(new Set(next.map((a) => a.trim()).filter(Boolean)))
        cleaned.sort((a, b) => a.localeCompare(b, 'ru'))
        setAuthorsState((prev) =>
          prev.length === cleaned.length && prev.every((v, i) => v === cleaned[i])
            ? prev
            : cleaned,
        )
      },
    }),
    [authors],
  )
  return (
    <QuotesListFiltersContext.Provider value={value}>
      {children}
    </QuotesListFiltersContext.Provider>
  )
}

export function useQuotesListFilters(): AuthorInfo {
  const ctx = useContext(QuotesListFiltersContext)
  if (!ctx) {
    throw new Error(
      'useQuotesListFilters must be used within <QuotesListFiltersProvider>',
    )
  }
  return ctx
}
