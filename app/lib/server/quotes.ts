import { DistanceSource, Prisma } from "@prisma/client"
import { geocodeAddress } from "./geocoding"
import { getPrismaClient } from "./prisma"
import { looksLikeQuotePublicCode, randomQuotePublicCode } from "./quote-public-code"
import { resolveDistance } from "./routing"
import type { CreateQuoteInput } from "./validators"

const LIST_QUOTES_MAX_TAKE = 200

function serializeQuote(q: {
  id: string
  publicCode: string | null
  depotId: string
  destinationAddress: string | null
  destinationLat: number | null
  destinationLng: number | null
  contractReference: string | null
  distanceKm: number
  distanceSource: string
  routingMeta: unknown
  inputLines: unknown
  breakdown: unknown
  total: Prisma.Decimal
  currency: string
  createdBy: string | null
  createdAt: Date
  depot?: { name: string; lat: number | null; lng: number | null; address: string | null }
}) {
  return {
    id: q.id,
    publicCode: q.publicCode,
    depotId: q.depotId,
    depotName: q.depot?.name,
    depotLat: q.depot?.lat ?? null,
    depotLng: q.depot?.lng ?? null,
    depotAddress: q.depot?.address ?? null,
    destinationAddress: q.destinationAddress,
    destinationLat: q.destinationLat,
    destinationLng: q.destinationLng,
    contractReference: q.contractReference ?? null,
    distanceKm: q.distanceKm,
    distanceSource: q.distanceSource,
    routingMeta: q.routingMeta,
    inputLines: q.inputLines,
    breakdown: q.breakdown,
    total: q.total.toFixed(2),
    currency: q.currency,
    createdBy: q.createdBy ?? null,
    createdAt: q.createdAt.toISOString(),
  }
}

async function computeQuote(input: CreateQuoteInput) {
  const prisma = getPrismaClient()
  const depot = await prisma.depot.findFirst({ orderBy: { createdAt: "asc" } })
  if (!depot) throw new Error("Нет записи производства (Depot). Запустите seed.")

  const address = input.destinationAddress?.trim() ?? ""
  const contract = (input.contractReference ?? "").trim()
  const contractReference = contract.length > 0 ? contract.slice(0, 120) : null
  if (address.length < 5) {
    throw new Error("Укажите адрес назначения (не короче 5 символов).")
  }
  const latIn = input.destinationLat
  const lngIn = input.destinationLng
  if ((latIn != null) !== (lngIn != null)) {
    throw new Error("Координаты назначения: передайте и широту, и долготу, или не передавайте ни одной.")
  }

  let destinationLat: number | null = null
  let destinationLng: number | null = null
  let geocodedLabel: string | undefined
  const hasClientCoords =
    latIn != null && lngIn != null && Number.isFinite(latIn) && Number.isFinite(lngIn)
  if (hasClientCoords) {
    destinationLat = latIn
    destinationLng = lngIn
    geocodedLabel = address
  } else {
    const geo = await geocodeAddress(address)
    if (!geo) {
      throw new Error("Адрес не удалось найти на карте. Выберите адрес из подсказок или уточните регион.")
    }
    destinationLat = geo.lat
    destinationLng = geo.lng
    geocodedLabel = geo.displayName
  }

  const route = resolveDistance({
    depotLat: depot.lat,
    depotLng: depot.lng,
    destinationLat,
    destinationLng,
    manualDistanceKm: null,
  })
  const routingMeta: Record<string, unknown> = {
    ...(route.meta && typeof route.meta === "object" ? route.meta : {}),
  }
  if (geocodedLabel) routingMeta.geocodedAs = geocodedLabel
  if (hasClientCoords) routingMeta.coordsSource = "dadata"

  const ids = [...new Set(input.lines.map((line) => line.vehicleTypeId))]
  const vehicles = await prisma.vehicleType.findMany({
    where: { id: { in: ids } },
    include: { tariff: true },
  })
  const byId = new Map(vehicles.map((v) => [v.id, v]))
  const breakdown: Array<Record<string, unknown>> = []
  let total = new Prisma.Decimal(0)
  for (const line of input.lines) {
    const vehicle = byId.get(line.vehicleTypeId)
    if (!vehicle || !vehicle.tariff) {
      throw new Error(`Тип ТС не найден или нет тарифа: ${line.vehicleTypeId}`)
    }
    const rate = new Prisma.Decimal(vehicle.tariff.ratePerKm)
    const min = new Prisma.Decimal(vehicle.tariff.minimumTotal)
    const dist = new Prisma.Decimal(route.distanceKm)
    const qty = new Prisma.Decimal(line.quantity)
    const raw = rate.mul(dist).mul(qty)
    const perVehicle = rate.mul(dist)
    const cappedPerVehicle = Prisma.Decimal.max(min, perVehicle)
    const sub = cappedPerVehicle.mul(qty)
    const minimumApplied = cappedPerVehicle.gt(perVehicle)
    breakdown.push({
      vehicleTypeId: vehicle.id,
      vehicleName: vehicle.name,
      quantity: line.quantity,
      ratePerKm: vehicle.tariff.ratePerKm.toString(),
      distanceKm: route.distanceKm,
      rawSubtotal: raw.toFixed(2),
      subtotal: sub.toFixed(2),
      minimumTotal: min.toFixed(2),
      minimumApplied,
    })
    total = total.add(sub)
  }

  return {
    depot,
    destinationAddress: address.length > 0 ? address : null,
    destinationLat,
    destinationLng,
    contractReference,
    distanceKm: route.distanceKm,
    distanceSource: route.distanceSource,
    routingMeta,
    inputLines: input.lines,
    breakdown,
    total,
  }
}

export async function previewQuote(input: CreateQuoteInput) {
  const computed = await computeQuote(input)
  return {
    preview: true as const,
    depotName: computed.depot.name,
    depotLat: computed.depot.lat,
    depotLng: computed.depot.lng,
    destinationAddress: computed.destinationAddress,
    destinationLat: computed.destinationLat,
    destinationLng: computed.destinationLng,
    contractReference: computed.contractReference,
    depotAddress: computed.depot.address ?? null,
    distanceKm: computed.distanceKm,
    distanceSource: computed.distanceSource,
    routingMeta: computed.routingMeta,
    inputLines: computed.inputLines,
    breakdown: computed.breakdown,
    total: computed.total.toFixed(2),
    currency: "RUB",
  }
}

export async function createQuote(input: CreateQuoteInput) {
  const prisma = getPrismaClient()
  const computed = await computeQuote(input)
  const createdBy = input.createdBy?.trim().length ? input.createdBy.trim().slice(0, 200) : null
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const publicCode = randomQuotePublicCode()
    try {
      const quote = await prisma.quote.create({
        data: {
          publicCode,
          depotId: computed.depot.id,
          destinationAddress: computed.destinationAddress,
          destinationLat: computed.destinationLat,
          destinationLng: computed.destinationLng,
          contractReference: computed.contractReference,
          distanceKm: computed.distanceKm,
          distanceSource: computed.distanceSource as DistanceSource,
          routingMeta: computed.routingMeta as Prisma.InputJsonValue,
          inputLines: computed.inputLines as Prisma.InputJsonValue,
          breakdown: computed.breakdown as Prisma.InputJsonValue,
          total: computed.total,
          currency: "RUB",
          createdBy,
        },
        include: {
          depot: { select: { name: true, lat: true, lng: true, address: true } },
        },
      })
      return serializeQuote(quote)
    } catch (error) {
      if (
        typeof error === "object" &&
        error != null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        continue
      }
      throw error
    }
  }
  throw new Error("Не удалось назначить публичный код расчёта")
}

export async function listQuotes(take = 30) {
  const prisma = getPrismaClient()
  const bounded = Math.min(Math.max(1, Math.floor(take)), LIST_QUOTES_MAX_TAKE)
  const rows = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    take: bounded,
    include: {
      depot: { select: { name: true, lat: true, lng: true, address: true } },
    },
  })
  return rows.map((row) => serializeQuote(row))
}

export async function getQuoteById(idOrCode: string) {
  const prisma = getPrismaClient()
  const raw = idOrCode.trim()
  if (!raw) return null
  const include = { depot: { select: { name: true, lat: true, lng: true, address: true } } }
  if (looksLikeQuotePublicCode(raw)) {
    return prisma.quote
      .findUnique({ where: { publicCode: raw.toUpperCase() }, include })
      .then((row) => (row ? serializeQuote(row) : null))
  }
  return prisma.quote.findUnique({ where: { id: raw }, include }).then((row) => (row ? serializeQuote(row) : null))
}
