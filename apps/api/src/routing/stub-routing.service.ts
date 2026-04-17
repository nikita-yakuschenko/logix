import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { DistanceSource } from '@prisma/client';
import type {
  IRoutingProvider,
  RoutingInput,
  RoutingResult,
} from './routing.types';

/** Коэффициент «дорога длиннее прямой» для грубой оценки без внешнего Routing API. */
const ROAD_FACTOR = 1.25;

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class StubRoutingService implements IRoutingProvider {
  async resolveDistance(input: RoutingInput): Promise<RoutingResult> {
    const manual = input.manualDistanceKm;
    if (manual != null && manual > 0) {
      return {
        distanceKm: manual,
        distanceSource: DistanceSource.MANUAL_OVERRIDE,
        meta: { note: 'Расстояние задано вручную' },
      };
    }

    const { depot, destinationLat, destinationLng } = input;
    if (
      depot.lat != null &&
      depot.lng != null &&
      destinationLat != null &&
      destinationLng != null
    ) {
      const air = haversineKm(
        depot.lat,
        depot.lng,
        destinationLat,
        destinationLng,
      );
      const est = air * ROAD_FACTOR;
      return {
        distanceKm: Math.round(est * 10) / 10,
        distanceSource: DistanceSource.ROUTING_API,
        meta: {
          note: 'Оценка по геодезии (заглушка RoutingProvider; позже — OSM/Yandex/Google)',
          airKm: Math.round(air * 10) / 10,
          roadFactor: ROAD_FACTOR,
        },
      };
    }

    throw new BadRequestException(
      'Не удалось оценить расстояние: задайте расстояние в км вручную или проверьте адрес производства в справочнике (координаты для расчёта).',
    );
  }
}
