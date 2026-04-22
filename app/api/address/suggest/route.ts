import { suggestAddress } from "@/lib/server/dadata"
import { jsonError } from "@/lib/server/http"
import { validateSuggestAddressPayload } from "@/lib/server/validators"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = validateSuggestAddressPayload(await req.json())
    return Response.json(await suggestAddress(body.query))
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Некорректный запрос", 400)
  }
}
