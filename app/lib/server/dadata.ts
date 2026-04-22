const SUGGEST_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address"

export type AddressSuggestionItem = {
  value: string
  unrestrictedValue: string
  lat: number | null
  lng: number | null
}

export async function suggestAddress(query: string): Promise<{
  suggestions: AddressSuggestionItem[]
  configured: boolean
}> {
  const q = query.trim()
  if (q.length < 2) return { suggestions: [], configured: Boolean(process.env.DADATA_API_KEY?.trim()) }

  const token = process.env.DADATA_API_KEY?.trim()
  if (!token) return { suggestions: [], configured: false }

  const timeoutMs = Math.min(
    Math.max(3000, Number(process.env.DADATA_FETCH_TIMEOUT_MS) || 12000),
    60000,
  )
  try {
    const res = await fetch(SUGGEST_URL, {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ query: q, count: 12 }),
    })
    if (!res.ok) return { suggestions: [], configured: true }
    const json = (await res.json()) as {
      suggestions?: Array<{
        value: string
        unrestricted_value?: string
        data?: { geo_lat?: unknown; geo_lon?: unknown }
      }>
    }
    const suggestions: AddressSuggestionItem[] = (json.suggestions ?? []).map((item) => {
      const latRaw = item.data?.geo_lat
      const lngRaw = item.data?.geo_lon
      const latParsed = latRaw != null ? Number.parseFloat(String(latRaw)) : Number.NaN
      const lngParsed = lngRaw != null ? Number.parseFloat(String(lngRaw)) : Number.NaN
      return {
        value: item.value,
        unrestrictedValue: item.unrestricted_value ?? item.value,
        lat: Number.isFinite(latParsed) ? latParsed : null,
        lng: Number.isFinite(lngParsed) ? lngParsed : null,
      }
    })
    return { suggestions, configured: true }
  } catch {
    return { suggestions: [], configured: true }
  }
}
