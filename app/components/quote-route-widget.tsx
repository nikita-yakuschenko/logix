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
  IconCurrencyRubel,
  IconMapPinFilled,
  IconRoute,
  IconTruckDelivery,
  IconUser,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
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
  /** Суммарное количество машин (все типы). */
  vehiclesCount: number
  /** Число разных типов ТС. */
  vehicleTypes: number
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
    vehiclesCount,
    vehicleTypes,
    authorName,
  } = props

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border',
        'bg-gradient-to-br from-primary/5 via-background to-emerald-500/5',
        'p-4 sm:p-5',
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(60%_120%_at_0%_0%,theme(colors.primary/12%),transparent_60%),radial-gradient(60%_120%_at_100%_100%,theme(colors.emerald.500/12%),transparent_60%)]" />

      <div className="relative flex min-w-0 items-center gap-3 sm:gap-4">
        <Endpoint
          icon={<IconBuildingFactory2 size={18} stroke={1.75} />}
          tint="primary"
          label="Откуда"
          name={fromName}
          addressShort={fromAddressShort}
          align="left"
        />

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <IconRoute size={14} stroke={2} className="text-muted-foreground" />
            <span className="tabular-nums">{distanceKm}</span>
            <span className="text-muted-foreground font-medium">км</span>
          </div>
          <RouteTrack />
        </div>

        <Endpoint
          icon={<IconMapPinFilled size={18} stroke={1.75} />}
          tint="emerald"
          label="Куда"
          name={toName}
          addressShort={toAddressShort}
          align="right"
        />
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 text-xs">
        <Metric
          icon={<IconCurrencyRubel size={14} stroke={2} />}
          label="Сумма"
          value={<span className="tabular-nums">{totalRub} ₽</span>}
          accent
        />
        <Metric
          icon={<IconTruckDelivery size={14} stroke={2} />}
          label="Парк"
          value={
            <span className="tabular-nums">
              {vehiclesCount} {pluralVehicle(vehiclesCount)}
              {vehicleTypes > 1 && (
                <span className="text-muted-foreground">
                  {' '}
                  · {vehicleTypes} {pluralTypes(vehicleTypes)}
                </span>
              )}
            </span>
          }
        />
        <Metric
          icon={<IconUser size={14} stroke={2} />}
          label="Кто считал"
          value={<span className="truncate">{authorName?.trim() || '—'}</span>}
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
      <motion.div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1',
          iconWrap,
        )}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
      >
        {icon}
      </motion.div>
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

function RouteTrack() {
  return (
    <div className="relative h-6 w-full">
      <svg
        width="100%"
        height="24"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="quoteRouteGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" className="[stop-color:theme(colors.primary)]" stopOpacity="0.6" />
            <stop offset="100%" className="[stop-color:theme(colors.emerald.500)]" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        <circle cx="1.5" cy="12" r="2.2" className="fill-primary" />
        <motion.circle
          cx="1.5"
          cy="12"
          r="4"
          className="fill-primary"
          initial={{ opacity: 0.35 }}
          animate={{ r: [4, 7, 4], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />

        <line
          x1="4"
          x2="96"
          y1="12"
          y2="12"
          stroke="url(#quoteRouteGrad)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
        <motion.line
          x1="4"
          x2="96"
          y1="12"
          y2="12"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="2 3"
          stroke="url(#quoteRouteGrad)"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -20 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />

        <circle cx="98.5" cy="12" r="2.2" className="fill-emerald-500" />
        <motion.circle
          cx="98.5"
          cy="12"
          r="4"
          className="fill-emerald-500"
          initial={{ opacity: 0.35 }}
          animate={{ r: [4, 7, 4], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.9 }}
        />
      </svg>

      <motion.div
        className="pointer-events-none absolute top-1/2 -translate-y-1/2"
        initial={{ left: '2%', opacity: 0 }}
        animate={{
          left: ['2%', '92%'],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 3.6,
          ease: 'easeInOut',
          times: [0, 0.08, 0.92, 1],
          repeat: Infinity,
          repeatDelay: 0.6,
        }}
        aria-hidden
      >
        <div
          className={cn(
            'flex size-5 items-center justify-center rounded-full',
            'bg-background text-foreground ring-1 ring-border shadow-sm',
          )}
        >
          <IconTruckDelivery size={14} stroke={2} />
        </div>
      </motion.div>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={cn(
          'min-w-0 truncate',
          accent ? 'text-foreground font-semibold' : 'font-medium',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function pluralVehicle(n: number): string {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return 'машина'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'машины'
  return 'машин'
}

function pluralTypes(n: number): string {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return 'тип'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'типа'
  return 'типов'
}
