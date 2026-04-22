export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (typeof window !== 'undefined') {
    return p
  }
  const base = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3000').replace(
    /\/$/,
    '',
  )
  return `${base}${p}`
}
