import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { apiUrl } from '@/lib/api-url'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AddressSuggestField } from '@/components/address-suggest-field'
import { loadQuoteDraft, saveQuoteDraft, type QuoteDraft } from '@/lib/quote-draft'
import { VehicleTypeSelect } from '@/components/vehicle-type-select'
import {
  VEHICLE_TYPES_FALLBACK,
  type VehicleTypeRow,
} from '@/lib/vehicle-types-fallback'
import { cn } from '@/lib/utils'
import { useSettings } from '@/settings/settings-context'
import { formatDistanceKm } from '@/lib/format-km'
import { quoteDetailPathSegment } from '@/lib/quote-path'
import { formatRubAmount } from '@/lib/format-rub'
import { RouteMiniMap } from '@/components/route-mini-map'

type QuoteLine = { vehicleTypeId: string; quantity: number }

type QuotePreview = {
  preview: true
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
  breakdown: unknown
  routingMeta: unknown
}

const LINE_SLOT_COUNT = 3

/** Ширина правой колонки с картой (px), только xl+; ключ для localStorage. */
const QUOTE_MAP_ASIDE_PX_KEY = 'quote-new-map-aside-px'
const QUOTE_MAP_ASIDE_DEFAULT = 520

const emptyLine = (): QuoteLine => ({ vehicleTypeId: '', quantity: 1 })

/** Ровно три строки состава (макс. три типа ТС). */
function normalizeLinesToSlots(input?: QuoteLine[] | null): QuoteLine[] {
  const src = Array.isArray(input) ? [...input] : []
  const out = src.map((l) => ({
    vehicleTypeId: l.vehicleTypeId ?? '',
    quantity: Math.max(1, l.quantity ?? 1),
  }))
  while (out.length < LINE_SLOT_COUNT) out.push(emptyLine())
  return out.slice(0, LINE_SLOT_COUNT)
}

const inputClass =
  'border-input bg-background placeholder:text-muted-foreground flex h-9 w-full rounded-lg border px-3 py-1 text-sm shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50'

function formFingerprint(
  destinationAddress: string,
  contractReference: string,
  lines: QuoteLine[],
  destinationLat: number | null,
  destinationLng: number | null,
) {
  return JSON.stringify({
    a: destinationAddress.trim(),
    c: contractReference.trim(),
    l: lines.map((x) => ({ i: x.vehicleTypeId, q: x.quantity })),
    lat: destinationLat,
    lng: destinationLng,
  })
}

type BreakdownRow = {
  vehicleName?: string
  quantity?: number
  subtotal?: string
}

/** Три строки таблицы: из расчёта или прочерки до первого «Рассчитать». */
function ResultBreakdownTable({ breakdown }: { breakdown: unknown }) {
  const raw = (
    Array.isArray(breakdown)
      ? breakdown.filter((x) => x && typeof x === 'object')
      : []
  ) as BreakdownRow[]
  const slots = [0, 1, 2].map((i) => raw[i] ?? null)
  const tc = 'border-border/80 border px-3 py-2 text-sm align-top'
  const thc = `${tc} bg-muted/40 font-medium`
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${thc} text-left`}>Тип ТС</th>
            <th className={`${thc} text-right tabular-nums`}>Кол-во</th>
            <th className={`${thc} text-right`}>По строке</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((row, i) => (
            <tr key={i}>
              <td className={tc}>{row?.vehicleName ?? '—'}</td>
              <td className={`${tc} text-right tabular-nums`}>
                {row?.quantity != null ? row.quantity : '—'}
              </td>
              <td className={`${tc} text-right font-medium tabular-nums`}>
                {row?.subtotal != null ? formatRubAmount(row.subtotal) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

async function parseApiError(res: Response): Promise<string> {
  let msg = `HTTP ${res.status}`
  try {
    const j = (await res.json()) as { message?: string | string[] }
    if (typeof j.message === 'string') msg = j.message
    else if (Array.isArray(j.message)) msg = j.message.join(', ')
  } catch {
    const t = await res.text()
    if (t) msg = t
  }
  return msg
}

export function QuoteNewPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [types, setTypes] = useState<VehicleTypeRow[]>([])
  const [vehicleTypesDemo, setVehicleTypesDemo] = useState(false)
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationLat, setDestinationLat] = useState<number | null>(null)
  const [destinationLng, setDestinationLng] = useState<number | null>(null)
  const [contractReference, setContractReference] = useState('')
  const [lines, setLines] = useState<QuoteLine[]>(() => normalizeLinesToSlots(null))
  const [calcLoading, setCalcLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<QuotePreview | null>(null)
  const [previewFp, setPreviewFp] = useState<string | null>(null)
  const [depotFromApi, setDepotFromApi] = useState<{
    name: string
    address: string | null
    lat: number | null
    lng: number | null
  } | null>(null)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const layoutRef = useRef<HTMLDivElement>(null)
  const [mapAsidePx, setMapAsidePx] = useState(QUOTE_MAP_ASIDE_DEFAULT)
  const mapAsidePxRef = useRef(mapAsidePx)
  mapAsidePxRef.current = mapAsidePx
  const [resizingMapAside, setResizingMapAside] = useState(false)
  const resizeDragRef = useRef({ startX: 0, startPx: QUOTE_MAP_ASIDE_DEFAULT })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUOTE_MAP_ASIDE_PX_KEY)
      if (!raw) return
      const n = Number(raw)
      if (Number.isFinite(n) && n >= 260 && n <= 1200) setMapAsidePx(n)
    } catch {
      /* localStorage недоступен */
    }
  }, [])

  useEffect(() => {
    if (!resizingMapAside) return
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeDragRef.current.startX
      const next = resizeDragRef.current.startPx + dx
      const total = layoutRef.current?.getBoundingClientRect().width ?? 1600
      const maxMap = Math.min(Math.floor(total * 0.68), total - 360)
      const minMap = 280
      setMapAsidePx(Math.min(maxMap, Math.max(minMap, next)))
    }
    const onUp = () => {
      setResizingMapAside(false)
      try {
        localStorage.setItem(
          QUOTE_MAP_ASIDE_PX_KEY,
          String(Math.round(mapAsidePxRef.current)),
        )
      } catch {
        /* */
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('blur', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('blur', onUp)
    }
  }, [resizingMapAside])

  const fp = useMemo(
    () =>
      formFingerprint(
        destinationAddress,
        contractReference,
        lines,
        destinationLat,
        destinationLng,
      ),
    [
      destinationAddress,
      contractReference,
      lines,
      destinationLat,
      destinationLng,
    ],
  )
  const previewStale =
    preview !== null && previewFp !== null && previewFp !== fp

  /** В localStorage только договор и строки ТС — адрес назначения не кэшируем (каждый новый расчёт с пустого). */
  const persistDraft = useCallback(
    (patch: Partial<QuoteDraft>) => {
      if (draftTimer.current) clearTimeout(draftTimer.current)
      draftTimer.current = setTimeout(() => {
        saveQuoteDraft({
          destinationAddress: '',
          destinationLat: null,
          destinationLng: null,
          contractReference,
          lines,
          ...patch,
        })
      }, 400)
    },
    [contractReference, lines],
  )

  useEffect(() => {
    const d = loadQuoteDraft()
    setContractReference(
      typeof d?.contractReference === 'string' ? d.contractReference : '',
    )
    if (d?.lines?.length) setLines(normalizeLinesToSlots(d.lines))
    else setLines(normalizeLinesToSlots(null))
  }, [])

  useEffect(() => {
    persistDraft({})
  }, [contractReference, lines, persistDraft])

  const applyFallbackTypes = useCallback(() => {
    const fb = VEHICLE_TYPES_FALLBACK
    setTypes(fb)
    setVehicleTypesDemo(true)
    setLines((prev) => {
      const p = normalizeLinesToSlots(prev)
      if (!p[0].vehicleTypeId) {
        p[0] = { ...p[0], vehicleTypeId: fb[0].id }
      }
      return p
    })
  }, [])

  const loadTypes = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/vehicle-types'))
      if (!res.ok) {
        applyFallbackTypes()
        return
      }
      const data = (await res.json()) as VehicleTypeRow[]
      if (!Array.isArray(data) || data.length === 0) {
        applyFallbackTypes()
        return
      }
      setTypes(data)
      setVehicleTypesDemo(false)
      setLines((prev) => {
        const p = normalizeLinesToSlots(prev)
        if (!p[0].vehicleTypeId && data[0]?.id) {
          p[0] = { ...p[0], vehicleTypeId: data[0].id }
        }
        return p
      })
    } catch {
      applyFallbackTypes()
    }
  }, [applyFallbackTypes])

  useEffect(() => {
    void loadTypes()
  }, [loadTypes])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(apiUrl('/api/depot'))
        if (!res.ok) return
        const d = (await res.json()) as {
          configured?: boolean
          name?: string
          address?: string | null
          lat?: number | null
          lng?: number | null
        }
        if (d.configured && d.name != null) {
          setDepotFromApi({
            name: d.name,
            address: d.address ?? null,
            lat: d.lat ?? null,
            lng: d.lng ?? null,
          })
        }
      } catch {
        /* карта без склада */
      }
    })()
  }, [])

  const buildBody = useCallback(
    (withAuthor: boolean): Record<string, unknown> => {
      const bodyLines = lines
        .filter((l) => l.vehicleTypeId)
        .map((l) => ({
          vehicleTypeId: l.vehicleTypeId,
          quantity: l.quantity,
        }))
      const body: Record<string, unknown> = {
        lines: bodyLines,
      }
      if (withAuthor) {
        body.createdBy = settings.displayName.trim() || 'Никита Якущенко'
      }
      const addr = destinationAddress.trim()
      if (addr) body.destinationAddress = addr
      const cref = contractReference.trim()
      if (cref) body.contractReference = cref
      if (
        destinationLat != null &&
        destinationLng != null &&
        Number.isFinite(destinationLat) &&
        Number.isFinite(destinationLng)
      ) {
        body.destinationLat = destinationLat
        body.destinationLng = destinationLng
      }
      return body
    },
    [
      destinationAddress,
      contractReference,
      destinationLat,
      destinationLng,
      lines,
      settings.displayName,
    ],
  )

  const runCalculate = async () => {
    if (vehicleTypesDemo) return
    const snapshot = formFingerprint(
      destinationAddress,
      contractReference,
      lines,
      destinationLat,
      destinationLng,
    )
    setCalcLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/quotes/preview'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(false)),
      })
      if (!res.ok) throw new Error(await parseApiError(res))
      const data = (await res.json()) as QuotePreview
      setPreview(data)
      setPreviewFp(snapshot)
    } catch (e) {
      setPreview(null)
      setPreviewFp(null)
      setError(e instanceof Error ? e.message : 'Ошибка расчёта')
    } finally {
      setCalcLoading(false)
    }
  }

  const runSave = async () => {
    if (vehicleTypesDemo || !preview || previewStale) return
    setSaveLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/quotes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(true)),
      })
      if (!res.ok) throw new Error(await parseApiError(res))
      const saved = (await res.json()) as {
        id: string
        publicCode?: string | null
      }
      navigate(`/quotes/${quoteDetailPathSegment(saved)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaveLoading(false)
    }
  }

  const formInvalid = !lines.some((l) => l.vehicleTypeId)

  const mapDepot = useMemo(() => {
    const lat = preview?.depotLat ?? depotFromApi?.lat
    const lng = preview?.depotLng ?? depotFromApi?.lng
    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return null
    }
    const addrLine =
      (preview?.depotAddress ?? depotFromApi?.address ?? '').trim() ||
      'Адрес склада не задан в БД'
    return {
      lat,
      lng,
      headline: 'Производство',
      addressLine: addrLine,
    }
  }, [preview, depotFromApi])

  const mapDestination = useMemo(() => {
    const lat = preview?.destinationLat ?? destinationLat
    const lng = preview?.destinationLng ?? destinationLng
    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return null
    }
    const addr =
      preview?.destinationAddress?.trim() || destinationAddress.trim()
    const cref =
      (preview?.contractReference ?? contractReference).trim() || 'Объект'
    return {
      lat,
      lng,
      headline: cref,
      addressLine: addr.length > 0 ? addr : '—',
    }
  }, [
    preview,
    destinationLat,
    destinationLng,
    destinationAddress,
    contractReference,
  ])

  const updateLine = (i: number, patch: Partial<QuoteLine>) => {
    setLines((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
      <div
        ref={layoutRef}
        className={cn(
          'flex flex-col gap-6 xl:flex-row xl:items-stretch xl:gap-0',
          resizingMapAside && 'cursor-col-resize select-none',
        )}
        style={
          {
            ['--quote-aside-px' as string]: `${mapAsidePx}px`,
          } as React.CSSProperties
        }
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Новый расчёт</CardTitle>
          <CardDescription>
            Сначала нажмите «Рассчитать» и проверьте сумму. Сохранение в список —
            отдельно, когда всё устроит.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {vehicleTypesDemo && (
            <p className="bg-amber-50 text-amber-950 rounded-md border border-amber-200/80 px-3 py-2 text-sm">
              Справочник типов ТС подставлен для примера (API недоступен или пустой).
              Чтобы считать по-настоящему, запустите backend и выполните сидер БД в{' '}
              <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">
                apps/api
              </code>
              .
            </p>
          )}
          <label className="block text-sm font-medium">
            Адрес назначения
            <div className="mt-1">
              <AddressSuggestField
                value={destinationAddress}
                onChange={setDestinationAddress}
                onCoordsChange={(lat, lng) => {
                  setDestinationLat(lat)
                  setDestinationLng(lng)
                }}
                placeholder="Адрес"
                disabled={vehicleTypesDemo}
              />
            </div>
          </label>

          <label className="block text-sm font-medium">
            Номер договора / объект
            <input
              className={`${inputClass} mt-1 max-w-md`}
              value={contractReference}
              onChange={(e) => setContractReference(e.target.value)}
              placeholder="Например: Д-4521 / объект «Склад Восток» — на карте над адресом назначения"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Если пусто — на карте у точки назначения будет подпись «Объект». Адрес под ней —
              как в поле «Куда везём».
            </p>
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Состав перевозки — тип ТС и количество машин в рейсе
            </p>
            {lines.map((line, i) => (
              <div
                key={i}
                className="border-border flex flex-wrap items-end gap-2 border-b pb-2"
              >
                <label className="min-w-[220px] flex-1 text-sm">
                  Тип ТС
                  <div className="mt-1">
                    <VehicleTypeSelect
                      types={types}
                      value={line.vehicleTypeId}
                      onChange={(vehicleTypeId) =>
                        updateLine(i, { vehicleTypeId })
                      }
                    />
                  </div>
                </label>
                <label className="w-28 text-sm">
                  Кол-во машин
                  <input
                    type="number"
                    min={1}
                    className={`${inputClass} mt-1`}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(i, {
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>

          {error && (
            <pre className="bg-destructive/10 text-destructive max-h-48 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
              {error}
            </pre>
          )}

          {previewStale && (
            <p className="text-muted-foreground text-sm">
              Данные формы изменились — нажмите «Рассчитать» снова, прежде чем
              сохранять.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => void runCalculate()}
              disabled={
                vehicleTypesDemo ||
                calcLoading ||
                formInvalid
              }
            >
              {calcLoading
                ? 'Считаем…'
                : vehicleTypesDemo
                  ? 'Нужен API для расчёта'
                  : 'Рассчитать'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => void runSave()}
              disabled={
                vehicleTypesDemo ||
                saveLoading ||
                calcLoading ||
                !preview ||
                previewStale ||
                formInvalid
              }
            >
              {saveLoading ? 'Сохраняем…' : 'Сохранить в списке'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Результат</CardTitle>
          <CardDescription>
            {preview ? (
              <>
                {preview.depotName ? `${preview.depotName} · ` : null}
                {formatDistanceKm(preview.distanceKm)}
              </>
            ) : (
              '—'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-semibold tabular-nums">
            Итого:{' '}
            {preview ? formatRubAmount(preview.total) : '—'}
          </p>
          <ResultBreakdownTable breakdown={preview?.breakdown ?? null} />
        </CardContent>
      </Card>
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Изменить ширину колонки с картой"
          className="hidden w-3 shrink-0 cursor-col-resize flex-col items-center justify-center xl:flex"
          onMouseDown={(e) => {
            e.preventDefault()
            resizeDragRef.current = {
              startX: e.clientX,
              startPx: mapAsidePxRef.current,
            }
            setResizingMapAside(true)
          }}
        >
          <span className="bg-border hover:bg-muted-foreground/50 h-full min-h-[100px] w-px max-w-full rounded-full transition-colors" />
        </div>

        <aside className="flex min-h-[280px] min-w-0 w-full flex-col self-stretch xl:sticky xl:top-6 xl:min-h-0 xl:w-[var(--quote-aside-px)] xl:max-w-[min(68vw,1200px)] xl:min-w-[260px] xl:shrink-0">
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
