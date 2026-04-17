import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('vehicle-types')
export class VehicleTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const rows = await this.prisma.vehicleType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { tariff: true },
    });
    return rows.map((v) => ({
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
    }));
  }
}
