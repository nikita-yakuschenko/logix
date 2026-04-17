"use client"

/**
 * Оболочка sidebar-07: провайдер, сайдбар без сворачивания на десктопе; на узких экранах
 * кнопка меню только открывает выезжающую панель (не «схлопывание» колонки).
 */
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const staticCrumbs: Record<string, { root: string; page: string }> = {
  '/': { root: 'logix', page: 'Расчёты' },
  '/quotes/new': { root: 'logix', page: 'Новый расчёт' },
  '/settings': { root: 'logix', page: 'Настройки' },
}

function resolveCrumbs(pathname: string) {
  if (staticCrumbs[pathname]) return staticCrumbs[pathname]
  if (/^\/quotes\/[^/]+$/.test(pathname) && pathname !== '/quotes/new') {
    return { root: 'logix', page: 'Расчёт' }
  }
  return { root: 'logix', page: 'Раздел' }
}

export function Sidebar07Shell() {
  const { pathname } = useLocation()
  const c = resolveCrumbs(pathname)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
          <div className="flex items-center gap-2 px-4">
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
            </div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink render={<Link to="/" />}>
                    {c.root}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{c.page}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
