export type LatLng = { lat: number; lng: number }

/** Одна точка на карте: заголовок (Производство / договор) и строка адреса как ввёл пользователь. */
export type MapRouteStop = LatLng & {
  headline: string
  addressLine: string
}

export type RouteMiniMapProps = {
  depot: MapRouteStop | null
  destination: MapRouteStop | null
  className?: string
}
