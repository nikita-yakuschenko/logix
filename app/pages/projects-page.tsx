'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ProjectsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[min(100%,96rem)] flex-col gap-6 px-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Проекты (Дома)</CardTitle>
          <CardDescription>
            Новый раздел для работы с проектами. Основа готова — дальше можно
            подключать данные и бизнес-логику.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Здесь будет список проектов/домов и связанные операции.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
