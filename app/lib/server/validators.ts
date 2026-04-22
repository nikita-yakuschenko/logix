export type QuoteLineInput = {
  vehicleTypeId: string
  quantity: number
}

export type CreateQuoteInput = {
  destinationAddress?: string
  destinationLat?: number
  destinationLng?: number
  contractReference?: string
  createdBy?: string
  lines: QuoteLineInput[]
}

export function validateSuggestAddressPayload(payload: unknown): { query: string } {
  if (payload == null || typeof payload !== "object") {
    throw new Error("Ожидается JSON-объект")
  }
  const query = String((payload as { query?: unknown }).query ?? "").trim()
  if (query.length < 2 || query.length > 400) {
    throw new Error("query должен быть от 2 до 400 символов")
  }
  return { query }
}

export function validateCreateQuotePayload(payload: unknown): CreateQuoteInput {
  if (payload == null || typeof payload !== "object") {
    throw new Error("Ожидается JSON-объект")
  }
  const raw = payload as Record<string, unknown>
  if (!Array.isArray(raw.lines) || raw.lines.length === 0) {
    throw new Error("lines должен содержать хотя бы одну строку")
  }
  const lines = raw.lines.map((line, index) => {
    if (line == null || typeof line !== "object") {
      throw new Error(`lines[${index}] должен быть объектом`)
    }
    const vehicleTypeId = String((line as { vehicleTypeId?: unknown }).vehicleTypeId ?? "").trim()
    const quantity = Number((line as { quantity?: unknown }).quantity)
    if (!vehicleTypeId) throw new Error(`lines[${index}].vehicleTypeId обязателен`)
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new Error(`lines[${index}].quantity должен быть числом >= 1`)
    }
    return { vehicleTypeId, quantity: Math.floor(quantity) }
  })

  return {
    lines,
    destinationAddress:
      typeof raw.destinationAddress === "string" ? raw.destinationAddress : undefined,
    destinationLat:
      raw.destinationLat == null ? undefined : Number(raw.destinationLat),
    destinationLng:
      raw.destinationLng == null ? undefined : Number(raw.destinationLng),
    contractReference:
      typeof raw.contractReference === "string" ? raw.contractReference : undefined,
    createdBy: typeof raw.createdBy === "string" ? raw.createdBy : undefined,
  }
}
