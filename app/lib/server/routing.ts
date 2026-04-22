import { DistanceSource } from "@prisma/client"

const ROAD_FACTOR = 1.25

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function resolveDistance(input: {
  depotLat: number | null
  depotLng: number | null
  destinationLat: number | null
  destinationLng: number | null
  manualDistanceKm: number | null
}) {
  if (input.manualDistanceKm != null && input.manualDistanceKm > 0) {
    return {
      distanceKm: input.manualDistanceKm,
      distanceSource: DistanceSource.MANUAL_OVERRIDE,
      meta: { note: "Расстояние задано вручную" },
    }
  }
  if (
    input.depotLat != null &&
    input.depotLng != null &&
    input.destinationLat != null &&
    input.destinationLng != null
  ) {
    const air = haversineKm(
      input.depotLat,
      input.depotLng,
      input.destinationLat,
      input.destinationLng,
    )
    const est = air * ROAD_FACTOR
    return {
      distanceKm: Math.round(est * 10) / 10,
      distanceSource: DistanceSource.ROUTING_API,
      meta: {
        note: "Оценка по геодезии (заглушка RoutingProvider; позже — OSM/Yandex/Google)",
        airKm: Math.round(air * 10) / 10,
        roadFactor: ROAD_FACTOR,
      },
    }
  }
  throw new Error(
    "Не удалось оценить расстояние: задайте расстояние в км вручную или проверьте адрес производства.",
  )
}
