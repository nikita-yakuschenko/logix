import { jsonError } from "@/lib/server/http"
import { listProjectTypesFromExcel } from "@/lib/server/projects"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") ?? "").trim().toLowerCase()
    const rows = listProjectTypesFromExcel()
    if (!q) return Response.json(rows)
    return Response.json(
      rows.filter((x) => x.projectType.toLowerCase().includes(q)),
    )
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Ошибка загрузки типов проектов из Excel",
      500,
    )
  }
}
