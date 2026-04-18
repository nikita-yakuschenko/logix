import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  type LogixSettings,
} from './types'

type Ctx = {
  settings: LogixSettings
  setSettings: (patch: Partial<LogixSettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<Ctx | null>(null)

function load(): LogixSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const p = JSON.parse(raw) as Record<string, unknown>
    if (p.version !== 1 && p.version !== 2) {
      return { ...DEFAULT_SETTINGS }
    }
    return {
      ...DEFAULT_SETTINGS,
      displayName:
        typeof p.displayName === 'string' ? p.displayName : '',
      version: 2,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** Только светлая тема: класс `dark` с корня не используется. */
function enforceLightOnly() {
  document.documentElement.classList.remove('dark')
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setState] = useState<LogixSettings>(() => load())

  useEffect(() => {
    enforceLightOnly()
  }, [])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  const setSettings = useCallback((patch: Partial<LogixSettings>) => {
    setState((s) => ({ ...s, ...patch, version: 2 as const }))
  }, [])

  const resetSettings = useCallback(() => {
    setState({ ...DEFAULT_SETTINGS })
    localStorage.removeItem(SETTINGS_KEY)
    enforceLightOnly()
  }, [])

  const value = useMemo(
    () => ({ settings, setSettings, resetSettings }),
    [settings, setSettings, resetSettings],
  )

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  const c = useContext(SettingsContext)
  if (!c) {
    throw new Error('useSettings вне SettingsProvider')
  }
  return c
}
