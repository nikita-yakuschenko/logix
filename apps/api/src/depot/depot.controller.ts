import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Координаты производства для карты на клиенте (один depot в MVP). */
@Controller('depot')
export class DepotController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDefault() {
    const depot = await this.prisma.depot.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, address: true, lat: true, lng: true },
    });
    if (!depot) {
      return { configured: false as const };
    }
    return {
      configured: true as const,
      id: depot.id,
      name: depot.name,
      address: depot.address,
      lat: depot.lat,
      lng: depot.lng,
    };
  }
}
