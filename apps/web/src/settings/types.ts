export type LogixSettings = {
  version: 2
  /** Имя в интерфейсе (локально) */
  displayName: string
}

export const DEFAULT_SETTINGS: LogixSettings = {
  version: 2,
  displayName: '',
}

export const SETTINGS_KEY = 'logix-settings'
