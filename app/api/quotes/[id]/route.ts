import { getQuoteById } from "@/lib/server/quotes"
import { jsonError } from "@/lib/server/http"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const quote = await getQuoteById(id)
    if (!quote) return jsonError("Расчет не найден", 404)
    return Response.json(quote)
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Ошибка загрузки", 400)
  }
}
