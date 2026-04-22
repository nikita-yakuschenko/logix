'use client'

/**
 * Шапка карточки расчёта в духе Apple Live Activity / крипто-транзакций:
 * слева — точка А (производство), справа — точка Б (объект), между ними
 * живой «трек» с бегущим пунктиром и едущим по нему грузовиком. Ниже —
 * чип-ряд с ключевыми метриками: сумма, парк, автор.
 *
 * Всё визуальное изолировано тут; страница передаёт только голые данные.
 */
import {
  IconBuildingFactory2,
  IconMapPinFilled,
} from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { DEFAULT_DISPLAY_NAME } from '@/settings/types'
import { cn } from '@/lib/utils'

export type QuoteRouteWidgetProps = {
  fromName: string
  fromAddressShort?: string | null
  toName: string
  toAddressShort?: string | null
  /** Уже отформатированное число километров (например "128"). */
  distanceKm: string
  /** Уже отформатированная сумма без знака валюты. */
  totalRub: string
  /** Человекочитаемая строка состава транспорта (например "1 фура и 1 трал"). */
  transportSummary: string
  authorName: string | null
}

export function QuoteRouteWidget(props: QuoteRouteWidgetProps) {
  const {
    fromName,
    fromAddressShort,
    toName,
    toAddressShort,
    distanceKm,
    totalRub,
    transportSummary,
    authorName,
  } = props

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border',
        'bg-linear-to-br from-primary/5 via-background to-emerald-500/5',
        'p-4 sm:p-5',
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(60%_120%_at_0%_0%,--theme(--color-primary/12%),transparent_60%),radial-gradient(60%_120%_at_100%_100%,--theme(--color-emerald-500/12%),transparent_60%)]" />

      <div className="relative flex min-w-0 items-center justify-between gap-3 sm:gap-4">
        <Endpoint
          icon={<IconBuildingFactory2 size={18} stroke={1.75} />}
          tint="primary"
          label="Производство"
          name={fromName}
          addressShort={fromAddressShort}
          align="left"
        />

        <Endpoint
          icon={<IconMapPinFilled size={18} stroke={1.75} />}
          tint="emerald"
          label="Объект"
          name={toName}
          addressShort={toAddressShort}
          align="right"
        />
      </div>

      <div className="relative mt-3">
        <RouteTrack distanceKm={distanceKm} />
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs">
        <Metric
          label="Стоимость перевозки"
          value={<span className="tabular-nums">{totalRub}</span>}
          accent
        />
        <Metric
          label="Транспорт"
          value={<span className="tabular-nums">{transportSummary}</span>}
        />
        <Metric
          label="Ответственный"
          value={
            <span className="truncate">
              {authorName?.trim() || DEFAULT_DISPLAY_NAME}
            </span>
          }
        />
      </div>
    </div>
  )
}

function Endpoint({
  icon,
  tint,
  label,
  name,
  addressShort,
  align,
}: {
  icon: ReactNode
  tint: 'primary' | 'emerald'
  label: string
  name: string
  addressShort?: string | null
  align: 'left' | 'right'
}) {
  const iconWrap =
    tint === 'primary'
      ? 'bg-primary/10 text-primary ring-primary/20'
      : 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400'

  return (
    <div
      className={cn(
        'flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3',
        align === 'right' && 'flex-row-reverse text-right',
      )}
      style={{ maxWidth: 'calc(50% - 40px)' }}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1',
          iconWrap,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="truncate text-sm font-semibold leading-tight" title={name}>
          {name}
        </p>
        {addressShort && (
          <p
            className="text-muted-foreground truncate text-[11px] leading-tight"
            title={addressShort}
          >
            {addressShort}
          </p>
        )}
      </div>
    </div>
  )
}

function RouteTrack({ distanceKm }: { distanceKm: string }) {
  return (
    <div className="flex w-full items-center gap-2.5">
      <span className="bg-primary size-2.5 shrink-0 rounded-full" aria-hidden />
      <span className="border-primary/45 block h-0 w-full flex-1 border-t border-dashed" aria-hidden />
      <span className="bg-background text-foreground border-border inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums sm:text-sm">
        {distanceKm} км
      </span>
      <span className="border-emerald-500/45 block h-0 w-full flex-1 border-t border-dashed" aria-hidden />
      <span className="bg-emerald-500 size-2.5 shrink-0 rounded-full" aria-hidden />
    </div>
  )
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string
  value: ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={cn(
          'min-w-0 truncate text-xs sm:text-sm',
          accent ? 'text-foreground font-semibold' : 'font-medium',
        )}
      >
        {value}
      </span>
    </div>
  )
}

