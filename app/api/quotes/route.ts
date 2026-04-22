import { createQuote, listQuotes } from "@/lib/server/quotes"
import { jsonError, parsePositiveTake } from "@/lib/server/http"
import { validateCreateQuotePayload } from "@/lib/server/validators"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const take = parsePositiveTake(searchParams.get("take"))
    return Response.json(await listQuotes(take))
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Ошибка загрузки списка", 500)
  }
}

export async function POST(req: Request) {
  try {
    const body = validateCreateQuotePayload(await req.json())
    return Response.json(await createQuote(body))
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Ошибка сохранения", 400)
  }
}
