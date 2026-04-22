'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiUrl } from '@/lib/api-url'
import { useQuoteDetailHeader } from '@/contexts/quote-detail-header-context'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { formatAddressThreeLines, formatObjectAddressLabel } from '@/lib/format-address-lines'
import { formatKmNumber } from '@/lib/format-km'
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
  distanceKm?: number
  subtotal?: string
}

function parseBreakdown(raw: unknown): BreakdownRow[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x) => x && typeof x === 'object') as BreakdownRow[]
}

function isFew(n: number): boolean {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  return mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)
}

function isOne(n: number): boolean {
  const abs = Math.abs(n)
  return abs % 10 === 1 && abs % 100 !== 11
}

type CanonicalVehicleKind = 'eurotruck' | 'lowboy' | 'cargoVan5t' | 'unknown'

function detectCanonicalVehicleKind(rawName: string): CanonicalVehicleKind {
  const raw = rawName.trim().toLowerCase()
  if (!raw) return 'unknown'

  if (
    raw.includes('еврофур') ||
    raw.includes('евро фур') ||
    raw.includes('фура') ||
    raw.includes('20т') ||
    raw.includes('20 т')
  ) {
    return 'eurotruck'
  }

  if (raw.includes('трал') || raw.includes('низкорам')) {
    return 'lowboy'
  }

  if (
    (raw.includes('фургон') || raw.includes('грузовой')) &&
    (raw.includes('5т') || raw.includes('5 т') || raw.includes('5тон') || raw.includes('5 тонн'))
  ) {
    return 'cargoVan5t'
  }

  return 'unknown'
}

function canonicalVehicleLabel(kind: CanonicalVehicleKind, quantity: number): string | null {
  const one = isOne(quantity)
  const few = isFew(quantity)

  if (kind === 'eurotruck') {
    if (one) return 'еврофура (тент)'
    if (few) return 'еврофуры (тент)'
    return 'еврофур (тент)'
  }

  if (kind === 'lowboy') {
    if (one) return 'низкорамный трал'
    if (few) return 'низкорамных трала'
    return 'низкорамных тралов'
  }

  if (kind === 'cargoVan5t') {
    if (one) return 'грузовой фургон (5 тонн)'
    if (few) return 'грузовых фургона (5 тонн)'
    return 'грузовых фургонов (5 тонн)'
  }

  return null
}

function canonicalVehicleTypeDisplayName(rawName: string): string {
  const kind = detectCanonicalVehicleKind(rawName)
  if (kind === 'eurotruck') return 'Еврофура (тент)'
  if (kind === 'lowboy') return 'Низкорамный трал'
  if (kind === 'cargoVan5t') return 'Грузовой фургон (5 тонн)'
  return rawName.trim() || '—'
}

function inflectVehicleName(baseName: string, quantity: number): string {
  const raw = baseName.trim().toLowerCase()
  if (!raw) return 'транспорт'

  const kind = detectCanonicalVehicleKind(raw)
  const canonical = canonicalVehicleLabel(kind, quantity)
  if (canonical) return canonical

  const inflectWord = (word: string): string => {
    if (isOne(quantity)) return word
    if (word.endsWith('а')) {
      if (isFew(quantity)) return `${word.slice(0, -1)}ы`
      return `${word.slice(0, -1)}`
    }
    if (word.endsWith('я')) {
      if (isFew(quantity)) return `${word.slice(0, -1)}и`
      return `${word.slice(0, -1)}ь`
    }
    if (word.endsWith('ь')) {
      if (isFew(quantity)) return `${word.slice(0, -1)}и`
      return `${word.slice(0, -1)}ей`
    }
    if (isFew(quantity)) return `${word}а`
    return `${word}ов`
  }

  const [head, ...rest] = raw.split(/\s+/)
  const inflectedHead = inflectWord(head)
  return rest.length > 0 ? `${inflectedHead} ${rest.join(' ')}` : inflectedHead
}

function formatTransportSummary(rows: BreakdownRow[]): string {
  const parts = rows
    .map((row) => ({
      quantity: Math.max(0, Number(row.quantity ?? 0)),
      vehicleName: (row.vehicleName ?? '').trim(),
    }))
    .filter((row) => row.quantity > 0 && row.vehicleName.length > 0)
    .map((row) => `${row.quantity} ${inflectVehicleName(row.vehicleName, row.quantity)}`)

  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]} и ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')} и ${parts[parts.length - 1]}`
}

function calcTransportRatePerVehicle(row: BreakdownRow): string | null {
  const subtotal = Number(row.subtotal ?? NaN)
  if (!Number.isFinite(subtotal)) return null
  const qty = Math.max(1, Number(row.quantity ?? 1))
  return (subtotal / qty).toFixed(2)
}

function RoutingMetaBlock({ meta }: { meta: unknown }) {
  if (meta == null || typeof meta !== 'object') {
    return <p className="text-muted-foreground">—</p>
  }
  const o = meta as Record<string, unknown>
  const rows: { label: string; value: string }[] = []
  const geocodedAs =
    typeof o.geocodedAs === 'string' && o.geocodedAs.trim()
      ? o.geocodedAs.trim()
      : null
  const airKm =
    typeof o.airKm === 'number' && Number.isFinite(o.airKm) ? o.airKm : null
  const roadFactor =
    typeof o.roadFactor === 'number' && Number.isFinite(o.roadFactor)
      ? o.roadFactor
      : null
  const note =
    typeof o.note === 'string' && o.note.trim() ? o.note.trim() : null

  if (geocodedAs) {
    rows.push({ label: 'Распознанный адрес', value: geocodedAs })
  }
  if (airKm != null) {
    rows.push({
      label: 'Расстояние по прямой',
      value: `${airKm.toFixed(1)} км`,
    })
  }
  if (roadFactor != null) {
    rows.push({
      label: 'Коэффициент дорожной сети',
      value: roadFactor.toFixed(2),
    })
  }
  if (note) {
    rows.push({ label: 'Комментарий', value: note })
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground">—</p>
  }
  return (
    <dl className="grid gap-3 sm:grid-cols-[minmax(0,260px)_1fr] sm:gap-x-6">
      {rows.map(({ label, value }, idx) => (
        <div key={`${label}-${idx}`} className="contents">
          <dt className="text-muted-foreground text-sm">{label}</dt>
          <dd className="text-sm wrap-break-word">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const tc = 'border-border/80 border px-3 py-2 text-sm align-top'
const thc = `${tc} bg-muted/40 font-medium`

export function QuoteDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [q, setQ] = useState<QuoteDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { setHeader } = useQuoteDetailHeader()

  const load = useCallback(async (signal: AbortSignal) => {
    if (!id) return
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(
        apiUrl(`/api/quotes/${encodeURIComponent(id)}`),
        { signal },
      )
      if (res.status === 404) {
        if (!signal.aborted) {
          setErr('Расчёт не найден')
          setQ(null)
        }
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as QuoteDetail
      if (!signal.aborted) setQ(data)
    } catch (e) {
      if (signal.aborted) return
      setErr(e instanceof Error ? e.message : 'Ошибка загрузки')
      setQ(null)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const ac = new AbortController()
    void load(ac.signal)
    return () => ac.abort()
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
  const transportSummary = formatTransportSummary(breakdownRows)
  const destinationSettlement = (() => {
    const raw = q.destinationAddress?.trim()
    if (!raw) return 'Объект'

    const three = formatAddressThreeLines(raw)
    const settlement = three.line2.trim()
    if (settlement) return settlement

    const line1 = three.line1.trim()
    if (!line1 || line1 === '—') return 'Объект'
    const parts = line1.split(',').map((p) => p.trim()).filter(Boolean)
    return parts[parts.length - 1] ?? 'Объект'
  })()

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
            fromName="г. Нижний Новгород"
            fromAddressShort={
              q.depotAddress?.trim()
                ? formatObjectAddressLabel(q.depotAddress)
                : null
            }
            toName={
              destinationSettlement
            }
            toAddressShort={
              q.destinationAddress?.trim()
                ? formatObjectAddressLabel(q.destinationAddress)
                : null
            }
            distanceKm={formatKmNumber(q.distanceKm) ?? '—'}
            totalRub={formatRubAmount(q.total)}
            transportSummary={transportSummary}
            authorName={q.createdBy}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-8 text-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                Адрес объекта (земельного участка)
              </p>
              <p className="truncate" title={q.destinationAddress?.trim() ?? '—'}>
                {q.destinationAddress?.trim() || '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                Название проекта
              </p>
              <p className="truncate" title={(q.contractReference ?? '').trim() || '—'}>
                {(q.contractReference ?? '').trim() || '—'}
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
                      <th className={`${thc} text-right`}>Ставка</th>
                      <th className={`${thc} text-right`}>Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.map((row, i) => {
                      const transportRate = calcTransportRatePerVehicle(row)
                      return (
                      <tr key={`${row.vehicleTypeId ?? 'row'}-${i}`}>
                        <td className={tc}>
                          {canonicalVehicleTypeDisplayName(row.vehicleName ?? '')}
                        </td>
                        <td className={`${tc} text-right tabular-nums`}>
                          {row.quantity ?? '—'}
                        </td>
                        <td className={`${tc} text-right tabular-nums`}>
                          {transportRate != null
                            ? formatRubAmount(transportRate)
                            : '—'}
                        </td>
                        <td className={`${tc} text-right font-medium tabular-nums`}>
                          {row.subtotal != null
                            ? formatRubAmount(row.subtotal)
                            : '—'}
                        </td>
                      </tr>
                      )
                    })}
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
