/**
 * База URL для запросов к Nest: в браузере — относительный путь (прокси Vite);
 * на SSR — полный origin (по умолчанию dev API).
 */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (typeof window !== 'undefined') {
    return p
  }
  const base = (process.env.API_URL ?? 'http://127.0.0.1:3000').replace(
    /\/$/,
    '',
  )
  return `${base}${p}`
}
