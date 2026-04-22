export type LogixSettings = {
  version: 2
  /** Имя в интерфейсе (локально) */
  displayName: string
}

export const DEFAULT_DISPLAY_NAME = 'Никита Якущенко'

export const DEFAULT_SETTINGS: LogixSettings = {
  version: 2,
  displayName: DEFAULT_DISPLAY_NAME,
}

export const SETTINGS_KEY = 'logix-settings'
