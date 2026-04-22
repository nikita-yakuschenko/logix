import { defineConfig } from "prisma/config"

const FALLBACK_DATABASE_URL = "postgresql://logix:logix@127.0.0.1:5433/logix?schema=public"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL?.trim() || FALLBACK_DATABASE_URL,
  },
})
