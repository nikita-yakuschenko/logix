import {
  useEffect,
  useState,
  type ComponentType,
} from 'react'
import { cn } from '@/lib/utils'
import type { RouteMiniMapProps } from './route-mini-map.types'

export type { LatLng, MapRouteStop } from './route-mini-map.types'
export type { RouteMiniMapProps }

/**
 * Карта Leaflet только в браузере — при SSR не подключаем leaflet (нет window).
 */
export function RouteMiniMap(props: RouteMiniMapProps) {
  const { depot, destination, className } = props
  const [Inner, setInner] =
    useState<ComponentType<RouteMiniMapProps> | null>(null)
  useEffect(() => {
    let cancelled = false
    void import('./route-mini-map-inner').then((m) => {
      if (!cancelled) setInner(() => m.RouteMiniMapInner)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const hasDepot =
    depot != null &&
    Number.isFinite(depot.lat) &&
    Number.isFinite(depot.lng)
  const hasDest =
    destination != null &&
    Number.isFinite(destination.lat) &&
    Number.isFinite(destination.lng)

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

  if (!Inner) {
    return (
      <div
        className={cn(
          'route-map-bw border-border bg-muted/20 text-muted-foreground flex min-h-[240px] flex-1 flex-col items-center justify-center rounded-xl border text-sm',
          className,
        )}
        aria-busy
      >
        Загрузка карты…
      </div>
    )
  }

  return <Inner {...props} />
}
