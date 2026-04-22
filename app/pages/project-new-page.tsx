'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ProjectNewPage() {
  return (
    <div className="mx-auto flex w-full max-w-[min(100%,96rem)] flex-col gap-6 px-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Новый проект</CardTitle>
          <CardDescription>
            Страница создания проекта. Подготовлена база, дальше подключим поля и
            импорт данных.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Форма будет добавлена следующим шагом.</p>
        </CardContent>
      </Card>
    </div>
  )
}
