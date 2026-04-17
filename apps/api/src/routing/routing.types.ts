import type { DistanceSource } from '@prisma/client';

/** Токен Nest DI для провайдера маршрутов. */
export const ROUTING_PROVIDER = 'ROUTING_PROVIDER';

export type DepotCoords = { lat: number | null; lng: number | null };

export type RoutingInput = {
  depot: DepotCoords;
  destinationLat?: number | null;
  destinationLng?: number | null;
  manualDistanceKm?: number | null;
};

export type RoutingResult = {
  distanceKm: number;
  distanceSource: DistanceSource;
  meta?: Record<string, unknown>;
};

export interface IRoutingProvider {
  resolveDistance(input: RoutingInput): Promise<RoutingResult>;
}
