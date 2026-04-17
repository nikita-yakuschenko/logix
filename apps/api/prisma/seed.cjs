/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const types = [
  { code: 'gazelle', name: 'Газель', sortOrder: 10, rate: 35, min: 2500 },
  { code: 'truck_5t', name: 'Грузовик до 5т', sortOrder: 20, rate: 48, min: 4000 },
  { code: 'truck_20t', name: 'Фура до 20т', sortOrder: 30, rate: 62, min: 9000 },
];

/** Склад по умолчанию (MVP): Нижний Новгород, ул. Зайцева, 31 — не Москва-заглушка. */
const DEPOT_DEFAULT = {
  name: 'Производство',
  address: '603158, г. Нижний Новгород, ул. Зайцева, д. 31',
  lat: 56.36664,
  lng: 43.795044,
};

async function main() {
  // Первый склад (MVP — один): всегда приводим к производству в НН, ул. Зайцева, 31.
  let depot = await prisma.depot.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!depot) {
    depot = await prisma.depot.create({ data: DEPOT_DEFAULT });
  } else {
    depot = await prisma.depot.update({
      where: { id: depot.id },
      data: DEPOT_DEFAULT,
    });
  }

  for (const t of types) {
    let vt = await prisma.vehicleType.findUnique({ where: { code: t.code } });
    if (!vt) {
      await prisma.vehicleType.create({
        data: {
          code: t.code,
          name: t.name,
          sortOrder: t.sortOrder,
          tariff: {
            create: {
              ratePerKm: t.rate,
              minimumTotal: t.min,
            },
          },
        },
      });
    } else {
      await prisma.vehicleType.update({
        where: { id: vt.id },
        data: { name: t.name, sortOrder: t.sortOrder },
      });
      await prisma.tariffRule.upsert({
        where: { vehicleTypeId: vt.id },
        update: { ratePerKm: t.rate, minimumTotal: t.min },
        create: {
          vehicleTypeId: vt.id,
          ratePerKm: t.rate,
          minimumTotal: t.min,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Seed OK, depot:', depot.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
