"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { VehicleTypeRow } from "@/lib/vehicle-types-fallback"
import { ChevronDownIcon } from "lucide-react"

function formatTypeLabel(t: VehicleTypeRow) {
  return `${t.name} · ${t.tariff?.ratePerKm ?? "?"} ₽/км, мин. ${t.tariff?.minimumTotal ?? "?"} ₽`
}

export function VehicleTypeSelect({
  types,
  value,
  onChange,
  disabled,
  id,
}: {
  types: VehicleTypeRow[]
  value: string
  onChange: (vehicleTypeId: string) => void
  disabled?: boolean
  id?: string
}) {
  const selected = types.find((t) => t.id === value)
  const label =
    value && selected ? formatTypeLabel(selected) : "— выберите тип —"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-input bg-background pl-3 pr-4 text-left text-sm shadow-sm",
              "outline-none transition-[color,box-shadow]",
              "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0",
              "data-[popup-open]:border-ring data-[popup-open]:ring-2 data-[popup-open]:ring-ring/30 data-[popup-open]:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        }
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !value && "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none size-4 shrink-0 text-muted-foreground opacity-80"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="max-h-60 min-w-[var(--anchor-width)] overflow-y-auto rounded-xl p-1.5 shadow-md ring-1 ring-foreground/10"
      >
        <DropdownMenuItem
          className="cursor-pointer rounded-lg"
          onClick={() => onChange("")}
        >
          <span className="text-muted-foreground">— выберите тип —</span>
        </DropdownMenuItem>
        {types.map((t) => (
          <DropdownMenuItem
            key={t.id}
            className="cursor-pointer rounded-lg"
            onClick={() => onChange(t.id)}
          >
            <span className="whitespace-normal break-words">
              {formatTypeLabel(t)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
