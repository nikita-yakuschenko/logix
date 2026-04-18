"use client"

/**
 * Оболочка sidebar-07: провайдер, сайдбар без сворачивания на десктопе; на узких экранах
 * кнопка меню только открывает выезжающую панель (не «схлопывание» колонки).
 * Шапка без breadcrumbs: в одном ряду слева — меню (моб.), «К списку» при необходимости,
 * сразу справа от неё — название раздела (не у противоположного края экрана).
 */
import { IconChevronLeft } from '@tabler/icons-react'
import { Link, Outlet, useLocation } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { buttonVariants } from '@/components/ui/button'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
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

export function Sidebar07Shell() {
  const { pathname } = useLocation()
  const pageTitle = resolvePageTitle(pathname)
  const backToList = showBackToQuotesList(pathname)
  const isQuotesList = pathname === '/'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center border-b transition-[width,height] ease-linear">
          <div className="flex min-h-0 w-full min-w-0 items-center gap-3 px-4 text-sm">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex items-center gap-2 md:hidden">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px shrink-0 bg-border" aria-hidden />
              </div>
              {backToList && (
                <Link
                  to="/"
                  className={cn(
                    'text-muted-foreground hover:text-foreground -ml-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors',
                    'hover:bg-muted/80',
                  )}
                >
                  <IconChevronLeft className="size-4 shrink-0" stroke={1.75} />
                  <span className="font-normal">К списку</span>
                </Link>
              )}
              <span
                className="text-foreground min-w-0 truncate font-medium"
                title={pageTitle}
              >
                {pageTitle}
              </span>
            </div>
            {isQuotesList && (
              <Link
                to="/quotes/new"
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
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
