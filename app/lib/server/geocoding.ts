export async function geocodeAddress(query: string): Promise<{
  lat: number
  lng: number
  displayName: string
} | null> {
  const q = query.trim()
  if (q.length < 3) return null
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", q)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")
  url.searchParams.set("addressdetails", "0")

  const userAgent =
    process.env.GEOCODING_USER_AGENT?.trim() ||
    "logix/1.0 (internal logistics; contact IT)"
  const timeoutMs = Math.min(
    Math.max(3000, Number(process.env.GEOCODING_FETCH_TIMEOUT_MS) || 12000),
    60000,
  )
  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": userAgent,
        "Accept-Language": "ru,en",
      },
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>
    const first = data?.[0]
    if (!first) return null
    const lat = Number.parseFloat(first.lat)
    const lng = Number.parseFloat(first.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng, displayName: first.display_name }
  } catch {
    return null
  }
}
