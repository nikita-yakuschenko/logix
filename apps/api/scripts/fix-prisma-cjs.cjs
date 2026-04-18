/**
 * Prisma 7 генерирует client.ts с import.meta; при emit в CommonJS tsc оставляет
 * import.meta.url в .js — Node грузит файл как ESM и падает (exports is not defined).
 * Заменяем на эквивалент для CJS.
 */
const fs = require('node:fs');
const path = require('node:path');

const clientJs = path.join(__dirname, '..', 'dist', 'generated', 'prisma', 'client.js');
if (!fs.existsSync(clientJs)) {
  console.warn('[fix-prisma-cjs] пропуск: нет', clientJs);
  process.exit(0);
}

let s = fs.readFileSync(clientJs, 'utf8');
if (!s.includes('import.meta')) {
  process.exit(0);
}

s = s.replace(
  /const node_url_1 = require\("node:url"\);\r?\n/,
  '',
);
s = s.replace(
  /globalThis\['__dirname'\] = path\.dirname\(\(0, node_url_1\.fileURLToPath\)\(import\.meta\.url\)\);/,
  "globalThis['__dirname'] = path.dirname(__filename);",
);

fs.writeFileSync(clientJs, s);
console.log('[fix-prisma-cjs] исправлен dist/generated/prisma/client.js');
