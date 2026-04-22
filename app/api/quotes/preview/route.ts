import { previewQuote } from "@/lib/server/quotes"
import { jsonError } from "@/lib/server/http"
import { validateCreateQuotePayload } from "@/lib/server/validators"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = validateCreateQuotePayload(await req.json())
    return Response.json(await previewQuote(body))
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Ошибка расчета", 400)
  }
}
