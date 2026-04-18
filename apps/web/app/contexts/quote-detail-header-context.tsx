'use client'

/**
 * Канал данных для шапки детальной страницы расчёта: страница пушит
 * { publicCode, createdAt } после загрузки, шапка читает и подставляет
 * в заголовок «Расчёт #... от DD.MM.YYYY». Отдельно от фильтров списка.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type QuoteHeaderInfo = {
  publicCode: string | null
  createdAt: string
}

type Ctx = {
  header: QuoteHeaderInfo | null
  setHeader: (info: QuoteHeaderInfo | null) => void
}

const QuoteDetailHeaderContext = createContext<Ctx | null>(null)

export function QuoteDetailHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<QuoteHeaderInfo | null>(null)

  const setHeader = useCallback((info: QuoteHeaderInfo | null) => {
    setHeaderState((prev) => {
      if (prev === info) return prev
      if (prev && info && prev.publicCode === info.publicCode && prev.createdAt === info.createdAt) {
        return prev
      }
      return info
    })
  }, [])

  const value = useMemo<Ctx>(() => ({ header, setHeader }), [header, setHeader])

  return (
    <QuoteDetailHeaderContext.Provider value={value}>
      {children}
    </QuoteDetailHeaderContext.Provider>
  )
}

export function useQuoteDetailHeader(): Ctx {
  const ctx = useContext(QuoteDetailHeaderContext)
  if (!ctx) {
    throw new Error(
      'useQuoteDetailHeader must be used within <QuoteDetailHeaderProvider>',
    )
  }
  return ctx
}
