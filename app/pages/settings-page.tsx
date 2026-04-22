'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { clearQuoteDraft } from '@/lib/quote-draft'
import { useSettings } from '@/settings/settings-context'

const inputClass =
  'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

export function SettingsPage() {
  const { settings, setSettings, resetSettings } = useSettings()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>
            Как к вам обращаться в интерфейсе (только локально, без сервера).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="text-sm font-medium block">
            Имя или должность
            <input
              className={`${inputClass} mt-1`}
              value={settings.displayName}
              onChange={(e) => setSettings({ displayName: e.target.value })}
              placeholder="Например: Иван, логист"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Память</CardTitle>
          <CardDescription>
            Черновик формы расчёта подставляется при следующем открытии страницы.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearQuoteDraft()
            }}
          >
            Очистить черновик расчёта
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (
                confirm(
                  'Сбросить все настройки logix в этом браузере? Черновик тоже удалится.',
                )
              ) {
                clearQuoteDraft()
                resetSettings()
              }
            }}
          >
            Сбросить всё
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
