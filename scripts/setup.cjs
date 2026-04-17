/**
 * Один раз из корня репозитория: npm run setup
 * — создаёт apps/api/.env из .env.example при необходимости;
 * — поднимает Postgres в Docker (если Docker доступен);
 * — применяет миграции Prisma.
 */
const { execSync } = require('node:child_process');
const { existsSync, copyFileSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'apps', 'api');
const envExample = path.join(root, '.env.example');
const envPath = path.join(apiDir, '.env');

if (!existsSync(envPath) && existsSync(envExample)) {
  copyFileSync(envExample, envPath);
  console.log('[logix] Создан apps/api/.env из .env.example\n');
}

try {
  execSync('docker compose up -d', { cwd: root, stdio: 'inherit', shell: true });
  console.log('');
} catch {
  console.warn(
    '[logix] Docker не поднялся (нет Docker Desktop или ошибка). Если Postgres уже есть на машине — укажи DATABASE_URL в apps/api/.env вручную.\n',
  );
}

try {
  execSync('npx prisma migrate deploy', { cwd: apiDir, stdio: 'inherit', shell: true });
} catch {
  console.error(
    '\n[logix] Миграции не применились. Проверь DATABASE_URL в apps/api/.env (для Docker из репозиитория: порт 5433).',
  );
  process.exit(1);
}

try {
  execSync('npx prisma db seed', { cwd: apiDir, stdio: 'inherit', shell: true });
} catch {
  console.warn(
    '\n[logix] Seed не выполнен. Справочники (производство, ТС, тарифы): cd apps/api && npx prisma db seed\n',
  );
}

console.log('\n[logix] Готово. Запуск: npm run dev\n');
