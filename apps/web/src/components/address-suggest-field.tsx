import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const inputClass =
  'border-input bg-background placeholder:text-muted-foreground flex h-9 w-full rounded-lg border px-3 py-1 text-sm shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50'

type Suggestion = {
  value: string
  unrestrictedValue: string
  lat: number | null
  lng: number | null
}

type SuggestResponse = {
  suggestions: Suggestion[]
  configured?: boolean
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

type Props = {
  id?: string
  value: string
  onChange: (address: string) => void
  /** Координаты из выбранной подсказки; null — ввод вручную или сброс. */
  onCoordsChange: (lat: number | null, lng: number | null) => void
  placeholder?: string
  disabled?: boolean
}

export function AddressSuggestField({
  id,
  value,
  onChange,
  onCoordsChange,
  placeholder,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [configured, setConfigured] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const runSuggest = useCallback(async (q: string) => {
    const t = q.trim()
    if (t.length < 2) {
      setItems([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/address/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: t }),
      })
      if (!res.ok) throw new Error(await parseApiError(res))
      const data = (await res.json()) as SuggestResponse
      setItems(Array.isArray(data.suggestions) ? data.suggestions : [])
      setConfigured(data.configured !== false)
      setOpen(true)
    } catch {
      setItems([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const onInputChange = (next: string) => {
    onChange(next)
    onCoordsChange(null, null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void runSuggest(next)
    }, 280)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current
      if (!el?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (s: Suggestion) => {
    onChange(s.unrestrictedValue)
    if (s.lat != null && s.lng != null) {
      onCoordsChange(s.lat, s.lng)
    } else {
      onCoordsChange(null, null)
    }
    setOpen(false)
    setItems([])
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        className={inputClass}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => {
          if (value.trim().length >= 2) void runSuggest(value)
        }}
      />
      {loading && (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs">
          …
        </span>
      )}
      {!configured && (
        <p className="text-muted-foreground mt-1 text-xs">
          Подсказки адресов: задайте{' '}
          <code className="rounded bg-muted px-1 py-0.5">DADATA_API_KEY</code> в{' '}
          <code className="rounded bg-muted px-1 py-0.5">apps/api/.env</code>.
        </p>
      )}
      {open && items.length > 0 && (
        <ul
          className={cn(
            'border-border bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border py-1 text-sm shadow-md',
          )}
          role="listbox"
        >
          {items.map((s, i) => (
            <li key={`${s.unrestrictedValue}-${i}`}>
              <button
                type="button"
                className="hover:bg-accent block w-full px-3 py-2 text-left text-sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                {s.value}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
