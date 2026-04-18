import { useEffect } from 'react'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { SettingsProvider } from '@/settings/settings-context'
import type { Route } from './+types/root'
import './index.css'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
]

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'logix' }]
}

export default function Root() {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>
            <SettingsProvider>
              <Outlet />
              <Toaster />
            </SettingsProvider>
          </TooltipProvider>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export function HydrateFallback() {
  return <p className="text-muted-foreground p-4 text-sm">Загрузка…</p>
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Ошибка'
  let details = 'Что-то пошло не так.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Ошибка'
    details =
      error.status === 404
        ? 'Страница не найдена.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-lg font-semibold">{message}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{details}</p>
      {stack && (
        <pre className="bg-muted mt-4 overflow-x-auto rounded-md p-3 text-xs">
          {stack}
        </pre>
      )}
    </div>
  )
}
