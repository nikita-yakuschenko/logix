import { jsonError } from "@/lib/server/http"
import { getProjectTypeDetailsBySlug } from "@/lib/server/projects"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const data = getProjectTypeDetailsBySlug(slug)
    if (!data) return jsonError("Тип проекта не найден", 404)
    return Response.json(data)
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Ошибка загрузки данных типа проекта",
      500,
    )
  }
}
