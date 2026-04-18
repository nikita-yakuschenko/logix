import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { apiUrl } from '@/lib/api-url'
import { useQuoteDetailHeader } from '@/contexts/quote-detail-header-context'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { AddressLinesBlock } from '@/components/address-lines'
import { formatObjectAddressLabel } from '@/lib/format-address-lines'
import { formatDistanceKm, formatKmNumber } from '@/lib/format-km'
import { formatRubAmount } from '@/lib/format-rub'
import { QuoteRouteWidget } from '@/components/quote-route-widget'
import { RouteMiniMap } from '@/components/route-mini-map'

type QuoteDetail = {
  id: string
  publicCode?: string | null
  depotName?: string
  depotLat?: number | null
  depotLng?: number | null
  depotAddress?: string | null
  destinationAddress: string | null
  destinationLat?: number | null
  destinationLng?: number | null
  contractReference?: string | null
  distanceKm: number
  distanceSource: string
  total: string
  createdAt: string
  createdBy: string | null
  routingMeta: unknown
  breakdown: unknown
}

type BreakdownRow = {
  vehicleTypeId?: string
  vehicleName?: string
  quantity?: number
  ratePerKm?: string
  distanceKm?: number
  rawSubtotal?: string
  subtotal?: string
  minimumTotal?: string
  minimumApplied?: boolean
}

function parseBreakdown(raw: unknown): BreakdownRow[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x) => x && typeof x === 'object') as BreakdownRow[]
}

function RoutingMetaBlock({ meta }: { meta: unknown }) {
  if (meta == null || typeof meta !== 'object') {
    return <p className="text-muted-foreground">—</p>
  }
  const o = meta as Record<string, unknown>
  const rows: { label: string; value: string }[] = []
  if (typeof o.note === 'string' && o.note.trim()) {
    rows.push({ label: 'Примечание', value: o.note })
  }
  if (typeof o.geocodedAs === 'string' && o.geocodedAs.trim()) {
    rows.push({ label: 'Как распознан адрес', value: o.geocodedAs })
  }
  for (const [key, val] of Object.entries(o)) {
    if (key === 'note' || key === 'geocodedAs') continue
    const value =
      val === null || val === undefined
        ? '—'
        : typeof val === 'object'
          ? JSON.stringify(val)
          : String(val)
    rows.push({ label: key, value })
  }
  if (rows.length === 0) {
    return <p className="text-muted-foreground">—</p>
  }
  return (
    <dl className="grid gap-3 sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-x-6">
      {rows.map(({ label, value }, idx) => (
        <div key={`${label}-${idx}`} className="contents">
          <dt className="text-muted-foreground text-sm">{label}</dt>
          <dd className="text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const tc = 'border-border/80 border px-3 py-2 text-sm align-top'
const thc = `${tc} bg-muted/40 font-medium`

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [q, setQ] = useState<QuoteDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { setHeader } = useQuoteDetailHeader()

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(
        apiUrl(`/api/quotes/${encodeURIComponent(id)}`),
      )
      if (res.status === 404) {
        setErr('Расчёт не найден')
        setQ(null)
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setQ((await res.json()) as QuoteDetail)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка загрузки')
      setQ(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  // Синхронизация заголовка шапки: номер и дата текущего расчёта
  useEffect(() => {
    if (q) {
      setHeader({
        publicCode: q.publicCode ?? null,
        createdAt: q.createdAt,
      })
    }
    return () => {
      setHeader(null)
    }
  }, [q, setHeader])

  if (loading) {
    return (
      <div className="text-muted-foreground mx-auto max-w-5xl px-6 py-6 text-sm">
        Загрузка…
      </div>
    )
  }

  if (err || !q) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-6">
        <p className="text-destructive text-sm">{err ?? 'Нет данных'}</p>
      </div>
    )
  }

  const breakdownRows = parseBreakdown(q.breakdown)

  const mapDepot =
    q.depotLat != null &&
    q.depotLng != null &&
    Number.isFinite(q.depotLat) &&
    Number.isFinite(q.depotLng)
      ? {
          lat: q.depotLat,
          lng: q.depotLng,
          headline: 'Производство',
          addressLine:
            (q.depotAddress ?? '').trim() || 'Адрес склада не задан в БД',
        }
      : null

  const mapDestination =
    q.destinationLat != null &&
    q.destinationLng != null &&
    Number.isFinite(q.destinationLat) &&
    Number.isFinite(q.destinationLng)
      ? {
          lat: q.destinationLat,
          lng: q.destinationLng,
          headline: (q.contractReference ?? '').trim() || 'Объект',
          addressLine: q.destinationAddress?.trim()
            ? q.destinationAddress.trim()
            : '—',
        }
      : null

  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[1fr_minmax(420px,min(560px,44vw))] xl:items-stretch xl:gap-8">
        <div className="flex min-h-0 min-w-0 flex-col gap-6">
      <Card>
        <CardHeader>
          <QuoteRouteWidget
            fromName={q.depotName?.trim() || 'Производство'}
            fromAddressShort={
              q.depotAddress?.trim()
                ? formatObjectAddressLabel(q.depotAddress)
                : null
            }
            toName={
              (q.contractReference ?? '').trim() || 'Объект'
            }
            toAddressShort={
              q.destinationAddress?.trim()
                ? formatObjectAddressLabel(q.destinationAddress)
                : null
            }
            distanceKm={formatKmNumber(q.distanceKm) ?? '—'}
            totalRub={formatRubAmount(q.total)}
            vehiclesCount={breakdownRows.reduce(
              (acc, r) => acc + (r.quantity ?? 0),
              0,
            )}
            vehicleTypes={breakdownRows.length}
            authorName={q.createdBy}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-8 text-sm">
          {(q.contractReference?.trim() ?? '') !== '' && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                Договор / объект
              </p>
              <p className="whitespace-pre-wrap">{q.contractReference?.trim()}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
              Куда
            </p>
            <AddressLinesBlock text={q.destinationAddress?.trim() ?? ''} />
          </div>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                Расстояние
              </p>
              <p className="tabular-nums">{formatDistanceKm(q.distanceKm)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                Источник км
              </p>
              <p>
                {q.distanceSource === 'MANUAL_OVERRIDE' ? 'вручную' : 'карта'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                Итого
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatRubAmount(q.total)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
              По типам транспорта
            </p>
            {breakdownRows.length === 0 ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={`${thc} text-left`}>Тип ТС</th>
                      <th className={`${thc} text-right tabular-nums`}>Кол-во</th>
                      <th className={`${thc} text-right tabular-nums`}>₽/км</th>
                      <th className={`${thc} text-right tabular-nums`}>Км</th>
                      <th className={`${thc} text-right`}>По формуле</th>
                      <th className={`${thc} text-right`}>Итого строки</th>
                      <th className={`${thc} text-right`}>Минимум</th>
                      <th className={`${thc} text-left`}>Мин. сработал</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.map((row, i) => (
                      <tr key={`${row.vehicleTypeId ?? 'row'}-${i}`}>
                        <td className={tc}>{row.vehicleName ?? '—'}</td>
                        <td className={`${tc} text-right tabular-nums`}>
                          {row.quantity ?? '—'}
                        </td>
                        <td className={`${tc} text-right tabular-nums`}>
                          {row.ratePerKm ?? '—'}
                        </td>
                        <td className={`${tc} text-right tabular-nums`}>
                          {formatKmNumber(row.distanceKm)}
                        </td>
                        <td className={`${tc} text-right tabular-nums`}>
                          {row.rawSubtotal != null
                            ? formatRubAmount(row.rawSubtotal)
                            : '—'}
                        </td>
                        <td className={`${tc} text-right font-medium tabular-nums`}>
                          {row.subtotal != null
                            ? formatRubAmount(row.subtotal)
                            : '—'}
                        </td>
                        <td className={`${tc} text-right tabular-nums`}>
                          {row.minimumTotal != null
                            ? formatRubAmount(row.minimumTotal)
                            : '—'}
                        </td>
                        <td className={tc}>
                          {row.minimumApplied === true
                            ? 'да'
                            : row.minimumApplied === false
                              ? 'нет'
                              : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {q.routingMeta != null && (
            <div>
              <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
                Маршрут и геокодинг
              </p>
              <RoutingMetaBlock meta={q.routingMeta} />
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        <aside className="flex min-h-0 min-w-0 flex-col self-stretch xl:sticky xl:top-6">
          <div className="flex min-h-0 flex-1 flex-col">
            <RouteMiniMap
              className="min-h-0 flex-1"
              depot={mapDepot}
              destination={mapDestination}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
