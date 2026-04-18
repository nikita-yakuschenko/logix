import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DistanceSource, Prisma } from '../generated/prisma/client';
import { GeocodingService } from '../geocoding/geocoding.service';
import { PrismaService } from '../prisma/prisma.service';
import type { IRoutingProvider } from '../routing/routing.types';
import { ROUTING_PROVIDER } from '../routing/routing.types';
import type { CreateQuoteDto } from './dto/create-quote.dto';

export type BreakdownLine = {
  vehicleTypeId: string;
  vehicleName: string;
  quantity: number;
  ratePerKm: string;
  distanceKm: number;
  rawSubtotal: string;
  subtotal: string;
  minimumTotal: string;
  minimumApplied: boolean;
};

type ComputedQuote = {
  depotId: string;
  depotName: string;
  depotLat: number | null;
  depotLng: number | null;
  depotAddress: string | null;
  destinationAddress: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  contractReference: string | null;
  distanceKm: number;
  distanceSource: DistanceSource;
  routingMeta: Record<string, unknown>;
  inputLines: CreateQuoteDto['lines'];
  breakdown: BreakdownLine[];
  total: Prisma.Decimal;
};

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
    @Inject(ROUTING_PROVIDER) private readonly routing: IRoutingProvider,
  ) {}

  /** Тот же расчёт, что и при сохранении, но без записи в БД. */
  async preview(dto: CreateQuoteDto) {
    const c = await this.computeQuote(dto);
    return {
      preview: true as const,
      depotName: c.depotName,
      depotLat: c.depotLat,
      depotLng: c.depotLng,
      destinationAddress: c.destinationAddress,
      destinationLat: c.destinationLat,
      destinationLng: c.destinationLng,
      contractReference: c.contractReference,
      depotAddress: c.depotAddress,
      distanceKm: c.distanceKm,
      distanceSource: c.distanceSource,
      routingMeta: c.routingMeta,
      inputLines: c.inputLines,
      breakdown: c.breakdown,
      total: c.total.toFixed(2),
      currency: 'RUB',
    };
  }

  async create(dto: CreateQuoteDto) {
    const c = await this.computeQuote(dto);
    const createdBy =
      dto.createdBy?.trim().length ? dto.createdBy.trim().slice(0, 200) : null;

    const quote = await this.prisma.quote.create({
      data: {
        depotId: c.depotId,
        destinationAddress: c.destinationAddress,
        destinationLat: c.destinationLat,
        destinationLng: c.destinationLng,
        contractReference: c.contractReference,
        distanceKm: c.distanceKm,
        distanceSource: c.distanceSource,
        routingMeta: c.routingMeta as Prisma.InputJsonValue,
        inputLines: c.inputLines as object,
        breakdown: c.breakdown as object,
        total: c.total,
        currency: 'RUB',
        createdBy,
      },
      include: {
        depot: { select: { name: true, lat: true, lng: true, address: true } },
      },
    });

    return this.serializeQuote(quote);
  }

  private async computeQuote(dto: CreateQuoteDto): Promise<ComputedQuote> {
    const depot = await this.prisma.depot.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!depot) {
      throw new NotFoundException('Нет записи производства (Depot). Запустите seed.');
    }

    const addr = dto.destinationAddress?.trim() ?? '';
    const cr = (dto.contractReference ?? '').trim();
    const contractReference = cr.length > 0 ? cr.slice(0, 120) : null;

    if (addr.length < 5) {
      throw new BadRequestException(
        'Укажите адрес назначения (не короче 5 символов), например населённый пункт и регион.',
      );
    }

    const latIn = dto.destinationLat;
    const lngIn = dto.destinationLng;
    if ((latIn != null) !== (lngIn != null)) {
      throw new BadRequestException(
        'Координаты назначения: передайте и широту, и долготу, или не передавайте ни одной.',
      );
    }

    let destinationLat: number | null = null;
    let destinationLng: number | null = null;
    let geocodedLabel: string | undefined;

    {
      const hasClientCoords =
        latIn != null &&
        lngIn != null &&
        Number.isFinite(latIn) &&
        Number.isFinite(lngIn);

      if (hasClientCoords) {
        destinationLat = latIn;
        destinationLng = lngIn;
        geocodedLabel = addr;
      } else {
        const g = await this.geocoding.geocodeAddress(addr);
        if (!g) {
          throw new BadRequestException(
            'Адрес не удалось найти на карте. Выберите адрес из подсказок (Dadata) или уточните населённый пункт и регион.',
          );
        }
        destinationLat = g.lat;
        destinationLng = g.lng;
        geocodedLabel = g.displayName;
      }
    }

    const route = await this.routing.resolveDistance({
      depot: { lat: depot.lat, lng: depot.lng },
      destinationLat,
      destinationLng,
      manualDistanceKm: null,
    });

    const metaMerged: Record<string, unknown> = {
      ...(route.meta && typeof route.meta === 'object' ? route.meta : {}),
    };
    if (geocodedLabel) {
      metaMerged.geocodedAs = geocodedLabel;
    }
    if (
      latIn != null &&
      lngIn != null &&
      destinationLat === latIn &&
      destinationLng === lngIn
    ) {
      metaMerged.coordsSource = 'dadata';
    }

    const distanceKm = route.distanceKm;
    const linesIn = dto.lines;
    const ids = [...new Set(linesIn.map((l) => l.vehicleTypeId))];
    const vehicles = await this.prisma.vehicleType.findMany({
      where: { id: { in: ids } },
      include: { tariff: true },
    });
    const byId = new Map(vehicles.map((v) => [v.id, v]));

    const breakdown: BreakdownLine[] = [];
    let total = new Prisma.Decimal(0);

    for (const line of linesIn) {
      const v = byId.get(line.vehicleTypeId);
      if (!v || !v.tariff) {
        throw new NotFoundException(`Тип ТС не найден или нет тарифа: ${line.vehicleTypeId}`);
      }
      const rate = new Prisma.Decimal(v.tariff.ratePerKm);
      const minT = new Prisma.Decimal(v.tariff.minimumTotal);
      const dist = new Prisma.Decimal(distanceKm);
      const qty = new Prisma.Decimal(line.quantity);
      const raw = rate.mul(dist).mul(qty);
      const perVehicle = rate.mul(dist);
      const cappedPerVehicle = Prisma.Decimal.max(minT, perVehicle);
      const sub = cappedPerVehicle.mul(qty);
      const minimumApplied = cappedPerVehicle.gt(perVehicle);
      breakdown.push({
        vehicleTypeId: v.id,
        vehicleName: v.name,
        quantity: line.quantity,
        ratePerKm: v.tariff.ratePerKm.toString(),
        distanceKm,
        rawSubtotal: raw.toFixed(2),
        subtotal: sub.toFixed(2),
        minimumTotal: minT.toFixed(2),
        minimumApplied,
      });
      total = total.add(sub);
    }

    return {
      depotId: depot.id,
      depotName: depot.name,
      depotLat: depot.lat,
      depotLng: depot.lng,
      depotAddress: depot.address ?? null,
      destinationAddress: addr.length > 0 ? addr : null,
      destinationLat,
      destinationLng,
      contractReference,
      distanceKm,
      distanceSource: route.distanceSource,
      routingMeta: metaMerged,
      inputLines: dto.lines,
      breakdown,
      total,
    };
  }

  async listRecent(take = 30) {
    const rows = await this.prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        depot: { select: { name: true, lat: true, lng: true, address: true } },
      },
    });
    return rows.map((q) => this.serializeQuote(q));
  }

  async findById(id: string) {
    const row = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        depot: { select: { name: true, lat: true, lng: true, address: true } },
      },
    });
    if (!row) {
      throw new NotFoundException('Расчёт не найден');
    }
    return this.serializeQuote(row);
  }

  private serializeQuote(q: {
    id: string;
    depotId: string;
    destinationAddress: string | null;
    destinationLat: number | null;
    destinationLng: number | null;
    contractReference?: string | null;
    distanceKm: number;
    distanceSource: string;
    routingMeta: unknown;
    inputLines: unknown;
    breakdown: unknown;
    total: Prisma.Decimal;
    currency: string;
    createdBy?: string | null;
    createdAt: Date;
    depot?: { name: string; lat: number | null; lng: number | null; address: string | null };
  }) {
    return {
      id: q.id,
      depotId: q.depotId,
      depotName: q.depot?.name,
      depotLat: q.depot?.lat ?? null,
      depotLng: q.depot?.lng ?? null,
      depotAddress: q.depot?.address ?? null,
      destinationAddress: q.destinationAddress,
      destinationLat: q.destinationLat,
      destinationLng: q.destinationLng,
      contractReference: q.contractReference ?? null,
      distanceKm: q.distanceKm,
      distanceSource: q.distanceSource,
      routingMeta: q.routingMeta,
      inputLines: q.inputLines,
      breakdown: q.breakdown,
      total: q.total.toFixed(2),
      currency: q.currency,
      createdBy: q.createdBy ?? null,
      createdAt: q.createdAt.toISOString(),
    };
  }
}
