import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

export function getPrismaClient(): PrismaClient {
  if (globalThis.prisma) return globalThis.prisma
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is required")
  }
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
  globalThis.prisma = client
  return client
}
