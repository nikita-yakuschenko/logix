export const QUOTE_DRAFT_KEY = 'logix-quote-draft'

export type QuoteDraft = {
  /** В хранилище не используется — всегда пусто (адрес не восстанавливаем между визитами). */
  destinationAddress: string
  /** Номер договора / объект — подпись на карте у точки назначения. */
  contractReference: string
  /** Не кэшируем; в save всегда null. */
  destinationLat: number | null
  destinationLng: number | null
  lines: { vehicleTypeId: string; quantity: number }[]
  updatedAt: string
}

export function loadQuoteDraft(): Partial<QuoteDraft> | null {
  try {
    const raw = localStorage.getItem(QUOTE_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<QuoteDraft>
  } catch {
    return null
  }
}

export function saveQuoteDraft(d: Partial<QuoteDraft>) {
  localStorage.setItem(
    QUOTE_DRAFT_KEY,
    JSON.stringify({ ...d, updatedAt: new Date().toISOString() }),
  )
}

export function clearQuoteDraft() {
  localStorage.removeItem(QUOTE_DRAFT_KEY)
}
