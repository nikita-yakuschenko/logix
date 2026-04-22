export const runtime = "nodejs"

export async function GET() {
  return new Response("Hello from Next API", { status: 200 })
}
