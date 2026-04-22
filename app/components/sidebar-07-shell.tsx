"use client"

/**
 * Оболочка sidebar-07: провайдер, сайдбар без сворачивания на десктопе; на узких экранах
 * кнопка меню только открывает выезжающую панель (не «схлопывание» колонки).
 * Шапка без breadcrumbs: в одном ряду слева — меню (моб.), «К списку» при необходимости,
 * сразу справа от неё — название раздела (не у противоположного края экрана).
 */
import { IconChevronLeft, IconSearch, IconX } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { QuotesFilters } from '@/components/quotes-filters'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  QuoteDetailHeaderProvider,
  useQuoteDetailHeader,
} from '@/contexts/quote-detail-header-context'
import { QuotesListFiltersProvider } from '@/contexts/quotes-list-filters-context'
import { cn } from '@/lib/utils'

const PAGE_TITLE: Record<string, string> = {
  '/': 'Расчёты',
  '/quotes/new': 'Новый расчёт',
  '/settings': 'Настройки',
}

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLE[pathname] !== undefined) return PAGE_TITLE[pathname]
  if (/^\/quotes\/[^/]+$/.test(pathname) && pathname !== '/quotes/new') {
    return 'Расчёт'
  }
  return 'Раздел'
}

/** Страницы, где показываем «К списку» (не главная со списком). */
function showBackToQuotesList(pathname: string): boolean {
  if (pathname === '/quotes/new') return true
  return /^\/quotes\/[^/]+$/.test(pathname) && pathname !== '/quotes/new'
}

function isQuoteDetailPath(pathname: string): boolean {
  return /^\/quotes\/[^/]+$/.test(pathname) && pathname !== '/quotes/new'
}

/** Заголовок шапки. На detail-странице подтягивает номер и дату из контекста. */
function HeaderTitle({
  pathname,
  fallback,
}: {
  pathname: string
  fallback: string
}) {
  const { header } = useQuoteDetailHeader()

  if (isQuoteDetailPath(pathname) && header) {
    const date = new Date(header.createdAt).toLocaleDateString('ru-RU')
    const code = header.publicCode?.trim()
    const fullTitle = code
      ? `Расчёт #${code} от ${date}`
      : `Расчёт от ${date}`
    return (
      <span
        className="text-foreground min-w-0 truncate font-medium"
        title={fullTitle}
      >
        Расчёт
        {code && (
          <>
            <span className="text-muted-foreground"> #</span>
            <span className="tabular-nums">{code}</span>
          </>
        )}
        <span className="text-muted-foreground"> от {date}</span>
      </span>
    )
  }

  return (
    <span
      className="text-foreground min-w-0 truncate font-medium"
      title={fallback}
    >
      {fallback}
    </span>
  )
}

export function Sidebar07Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageTitle = resolvePageTitle(pathname)
  const backToList = showBackToQuotesList(pathname)
  const isQuotesList = pathname === '/'
  const searchValue = searchParams.get('q') ?? ''

  // Обновление URL без истории: один шаг «назад» не перепрыгивает каждый ввод символа
  const updateSearch = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    const trimmed = value.trimStart()
    if (trimmed) next.set('q', trimmed)
    else next.delete('q')
    const query = next.toString()
    const href = query ? `${pathname}?${query}` : pathname
    router.replace(href, { scroll: false })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <QuotesListFiltersProvider>
        <QuoteDetailHeaderProvider>
        <SidebarInset>
        <header className="flex h-16 shrink-0 items-center border-b transition-[width,height] ease-linear">
          <div className="flex min-h-0 w-full min-w-0 items-center gap-3 px-4 text-sm">
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <div className="flex items-center gap-2 md:hidden">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px shrink-0 bg-border" aria-hidden />
              </div>
              {backToList && (
                <Link
                  href="/"
                  className={cn(
                    'text-muted-foreground hover:text-foreground -ml-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors',
                    'hover:bg-muted/80',
                  )}
                >
                  <IconChevronLeft className="size-4 shrink-0" stroke={1.75} />
                  <span className="font-normal">К списку</span>
                </Link>
              )}
              <HeaderTitle pathname={pathname} fallback={pageTitle} />
            </div>
            {isQuotesList ? (
              <div className="flex min-w-0 flex-1 justify-center">
                <div className="flex w-full max-w-xl items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <IconSearch
                      className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                      stroke={1.75}
                      aria-hidden
                    />
                    <Input
                      type="search"
                      value={searchValue}
                      onChange={(e) => updateSearch(e.target.value)}
                      placeholder="Поиск по номеру, адресу, автору или дате"
                      aria-label="Поиск по расчётам"
                      className={cn(
                        'h-9 rounded-md pr-9 pl-9',
                        // гасим нативный крестик Chrome/Safari для type="search"
                        '[&::-webkit-search-cancel-button]:appearance-none',
                        '[&::-webkit-search-decoration]:appearance-none',
                        '[&::-webkit-search-results-button]:appearance-none',
                        '[&::-webkit-search-results-decoration]:appearance-none',
                      )}
                    />
                    {searchValue && (
                      <button
                        type="button"
                        onClick={() => updateSearch('')}
                        className={cn(
                          'text-muted-foreground hover:text-foreground absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm transition-colors',
                          'focus-visible:ring-ring focus-visible:ring-2 outline-none',
                        )}
                        aria-label="Очистить поиск"
                        title="Очистить"
                      >
                        <IconX className="size-3.5" stroke={2} />
                      </button>
                    )}
                  </div>
                  <QuotesFilters />
                </div>
              </div>
            ) : (
              <div className="flex-1" aria-hidden />
            )}
            {isQuotesList && (
              <Link
                href="/quotes/new"
                className={cn(
                  // sm даёт text-[0.8rem] — мельче заголовка шапки и хуже по вертикали; lg (h-9) + text-sm + leading-none — ровнее в h-16
                  buttonVariants({ variant: 'default', size: 'lg' }),
                  'shrink-0 px-4 leading-none',
                )}
              >
                Новый расчёт
              </Link>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
        </SidebarInset>
        </QuoteDetailHeaderProvider>
      </QuotesListFiltersProvider>
    </SidebarProvider>
  )
}
