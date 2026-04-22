export function jsonError(message: string, status = 400) {
  return Response.json({ message }, { status })
}

export function parsePositiveTake(value: string | null, fallback = 30, max = 200) {
  const parsed = value != null && value !== "" ? parseInt(value, 10) : NaN
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, max)
}
