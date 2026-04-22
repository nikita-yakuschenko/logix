/** Километры в ru-RU: запятая в дроби, разделитель тысяч, 2 знака после запятой. */

const kmOpts = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const

/** Только число (для колонки «Км», где единица в заголовке). */
export function formatKmNumber(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return '—'
  return km.toLocaleString('ru-RU', kmOpts)
}

/** С неразрывным « км» — список, карточка, подписи. */
export function formatDistanceKm(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return '—'
  return `${km.toLocaleString('ru-RU', kmOpts)}\u00a0км`
}
