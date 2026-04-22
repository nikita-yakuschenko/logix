import { getPrismaClient } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET() {
  const prisma = getPrismaClient()
  const rows = await prisma.vehicleType.findMany({
    orderBy: { sortOrder: "asc" },
    include: { tariff: true },
  })
  return Response.json(
    rows.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      sortOrder: v.sortOrder,
      tariff: v.tariff
        ? {
            ratePerKm: v.tariff.ratePerKm.toString(),
            minimumTotal: v.tariff.minimumTotal.toString(),
            currency: v.tariff.currency,
          }
        : null,
    })),
  )
}
