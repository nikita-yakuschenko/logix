import { getPrismaClient } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET() {
  const prisma = getPrismaClient()
  const depot = await prisma.depot.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, address: true, lat: true, lng: true },
  })
  if (!depot) {
    return Response.json({ configured: false as const })
  }
  return Response.json({
    configured: true as const,
    id: depot.id,
    name: depot.name,
    address: depot.address,
    lat: depot.lat,
    lng: depot.lng,
  })
}
