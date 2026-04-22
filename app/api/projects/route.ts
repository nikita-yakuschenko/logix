import { jsonError } from "@/lib/server/http"
import { loadProjectsFromExcel } from "@/lib/server/projects"

export const runtime = "nodejs"

export async function GET() {
  try {
    const projects = loadProjectsFromExcel()
    return Response.json(projects)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Ошибка загрузки проектов из Excel",
      500,
    )
  }
}
