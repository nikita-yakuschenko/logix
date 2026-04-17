import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AddressLinesBlock } from '@/components/address-lines'
import { Badge } from '@/components/ui/badge'
import { hoverCardSurfaceClassName } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'

export type LatLng = { lat: number; lng: number }

/** Одна точка на карте: заголовок (Производство / договор) и строка адреса как ввёл пользователь. */
export type MapRouteStop = LatLng & {
  headline: string
  addressLine: string
}

type Props = {
  depot: MapRouteStop | null
  destination: MapRouteStop | null
  className?: string
}

/** Булавка (не круг): остриё на координате; адрес — во всплывающем окне по клику. */
function endpointPinIcon(kind: 'depot' | 'dest'): L.DivIcon {
  const s = 30
  const k = kind === 'depot' ? 'depot' : 'dest'
  const html = `<div class="route-map-endpoint-pin route-map-endpoint-pin--${k}" role="presentation" aria-hidden="true">
<svg class="route-map-endpoint-pin__svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path class="route-map-endpoint-pin__shape" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
</svg></div>`
  // Нижняя вершина капли ≈ (12,22) в viewBox 24 — якорь на острие
  return L.divIcon({
    className: 'leaflet-div-icon route-map-endpoint',
    html,
    iconSize: [s, s],
    iconAnchor: [s / 2, (22 / 24) * s],
    popupAnchor: [0, -(22 / 24) * s],
  })
}

function formatDistanceKm(km: number): string {
  const rounded = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10
  const s = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: km >= 100 ? 0 : 1,
    maximumFractionDigits: km >= 100 ? 0 : 1,
  }).format(rounded)
  return `${s}\u00a0км`
}

/**
 * Плашка как hover-card. `legDistanceKm` передаётся только у точки Б — расстояние А→Б;
 * у производства (А) проп не задаём.
 */
function StopPopup({
  headline,
  addressLine,
  legDistanceKm,
}: {
  headline: string
  addressLine: string
  /** Только для точки назначения: км по плечу от А. */
  legDistanceKm?: number | null
}) {
  const showBadge =
    legDistanceKm !== undefined &&
    legDistanceKm != null &&
    Number.isFinite(legDistanceKm)
  return (
    <div
      className={cn(
        hoverCardSurfaceClassName,
        'relative w-64 text-left font-sans text-xs leading-normal',
      )}
    >
      {showBadge && (
        <Badge
          variant="secondary"
          className="pointer-events-none absolute top-2 right-2 z-10 tabular-nums"
        >
          {formatDistanceKm(legDistanceKm)}
        </Badge>
      )}
      <div className={cn('flex flex-col gap-0.5', showBadge && 'pr-[3.75rem]')}>
        <div className="font-semibold">{headline}</div>
        <AddressLinesBlock text={addressLine || ''} />
      </div>
    </div>
  )
}

function FitView({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 11)
      return
    }
    const b = L.latLngBounds(points.map(([la, ln]) => L.latLng(la, ln)))
    map.fitBounds(b.pad(0.12))
  }, [map, points])
  return null
}

type OsrmResponse = {
  routes?: Array<{
    geometry?: { coordinates?: number[][] }
    distance?: number
  }>
}

/** Расстояние по дуге между двумя точками (км), если нет ответа OSRM. */
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

async function fetchRoadRoute(
  from: LatLng,
  to: LatLng,
  signal: AbortSignal,
): Promise<{ path: [number, number][]; distanceKm: number } | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=simplified&geometries=geojson`
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const j = (await res.json()) as OsrmResponse
  const route = j?.routes?.[0]
  const coords = route?.geometry?.coordinates
  const distM = route?.distance
  if (!Array.isArray(coords) || coords.length < 2) return null
  const path = coords.map((c) => [c[1], c[0]] as [number, number])
  const distanceKm =
    typeof distM === 'number' && Number.isFinite(distM)
      ? distM / 1000
      : haversineKm(from, to)
  return { path, distanceKm }
}

/** Карта в нейтральных тонах: точки маршрута + линия (OSRM или прямая); адрес по клику во всплывающем окне. */
export function RouteMiniMap({ depot, destination, className }: Props) {
  const hasDepot =
    depot != null &&
    Number.isFinite(depot.lat) &&
    Number.isFinite(depot.lng)
  const hasDest =
    destination != null &&
    Number.isFinite(destination.lat) &&
    Number.isFinite(destination.lng)

  const depotIcon = useMemo(
    () => (hasDepot ? endpointPinIcon('depot') : null),
    [hasDepot],
  )

  const destIcon = useMemo(
    () => (hasDest ? endpointPinIcon('dest') : null),
    [hasDest],
  )

  const endpoints = useMemo((): [number, number][] => {
    const p: [number, number][] = []
    if (hasDepot) p.push([depot!.lat, depot!.lng])
    if (hasDest) p.push([destination!.lat, destination!.lng])
    return p
  }, [depot, destination, hasDepot, hasDest])

  const straightPath = useMemo((): [number, number][] => {
    if (!hasDepot || !hasDest) return []
    return [
      [depot!.lat, depot!.lng],
      [destination!.lat, destination!.lng],
    ]
  }, [depot, destination, hasDepot, hasDest])

  const [roadPath, setRoadPath] = useState<[number, number][] | null>(null)
  /** Длина плеча по дорогам (OSRM, м → км); иначе null — показываем гаверсинус. */
  const [osrmDistanceKm, setOsrmDistanceKm] = useState<number | null>(null)

  const legDistanceKm = useMemo((): number | null => {
    if (!hasDepot || !hasDest || !depot || !destination) return null
    if (osrmDistanceKm != null) return osrmDistanceKm
    return haversineKm(depot, destination)
  }, [hasDepot, hasDest, depot, destination, osrmDistanceKm])

  useEffect(() => {
    if (!hasDepot || !hasDest || !depot || !destination) {
      setRoadPath(null)
      setOsrmDistanceKm(null)
      return
    }
    setRoadPath(null)
    setOsrmDistanceKm(null)
    const ac = new AbortController()
    let alive = true
    void (async () => {
      try {
        const road = await fetchRoadRoute(depot, destination, ac.signal)
        if (!alive || ac.signal.aborted) return
        if (road && road.path.length >= 2) {
          setRoadPath(road.path)
          setOsrmDistanceKm(road.distanceKm)
        }
      } catch {
        /* прямая + гаверсинус в legDistanceKm */
      }
    })()
    return () => {
      alive = false
      ac.abort()
    }
  }, [
    hasDepot,
    hasDest,
    depot?.lat,
    depot?.lng,
    destination?.lat,
    destination?.lng,
  ])

  const drawnLine =
    roadPath != null && roadPath.length >= 2
      ? roadPath
      : straightPath.length >= 2
        ? straightPath
        : []

  const pathKind: 'idle' | 'road' | 'straight' =
    roadPath != null && roadPath.length >= 2
      ? 'road'
      : straightPath.length >= 2
        ? 'straight'
        : 'idle'

  const center: [number, number] = useMemo(() => {
    if (hasDepot) return [depot!.lat, depot!.lng]
    if (hasDest) return [destination!.lat, destination!.lng]
    return [56.32, 44.0]
  }, [depot, destination, hasDepot, hasDest])

  const fitPoints = drawnLine.length >= 2 ? drawnLine : endpoints

  if (!hasDepot && !hasDest) {
    return (
      <div
        className={cn(
          'border-border bg-muted/30 text-muted-foreground flex min-h-[200px] flex-1 flex-col items-center justify-center rounded-xl border p-4 text-center text-sm',
          className,
        )}
      >
        <p>Нет координат для карты.</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'route-map-bw border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm',
        className,
      )}
    >
      <MapContainer
        center={center}
        zoom={hasDepot && hasDest ? 8 : 11}
        className="route-map-leaflet z-0 min-h-0 w-full flex-1"
        style={{ height: '100%', width: '100%', minHeight: 0 }}
        scrollWheelZoom
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {drawnLine.length >= 2 && (
          <Polyline
            positions={drawnLine}
            pathOptions={{
              color: pathKind === 'road' ? '#262626' : '#737373',
              weight: pathKind === 'road' ? 4 : 3,
              opacity: 0.88,
              dashArray: pathKind === 'road' ? undefined : '9 7',
            }}
          />
        )}
        {hasDepot && depotIcon && (
          <Marker position={[depot!.lat, depot!.lng]} icon={depotIcon}>
            <Popup closeButton={false} className="route-map-stop-popup">
              <StopPopup
                headline={depot!.headline}
                addressLine={depot!.addressLine}
              />
            </Popup>
          </Marker>
        )}
        {hasDest && destIcon && (
          <Marker
            position={[destination!.lat, destination!.lng]}
            icon={destIcon}
          >
            <Popup closeButton={false} className="route-map-stop-popup">
              <StopPopup
                headline={destination!.headline}
                addressLine={destination!.addressLine}
                legDistanceKm={legDistanceKm}
              />
            </Popup>
          </Marker>
        )}
        <FitView points={fitPoints} />
      </MapContainer>
    </div>
  )
}
