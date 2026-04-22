import { getPrismaClient } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const prisma = getPrismaClient()
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: "ok", service: "logix-api", database: "ok" as const })
  } catch {
    return Response.json({ status: "ok", service: "logix-api", database: "error" as const })
  }
}
