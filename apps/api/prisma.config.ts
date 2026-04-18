import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// URL для CLI (migrate, db push); рантайм — адатер в PrismaService / seed.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
