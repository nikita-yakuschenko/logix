import { Injectable, Logger } from '@nestjs/common';

/** Геокодирование адреса в координаты (OpenStreetMap Nominatim; для внутреннего MVP). */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  /**
   * Прямой геокодинг. При отсутствии результата — null.
   * Политика Nominatim: не больше ~1 запроса/с без собственного инстанса.
   */
  async geocodeAddress(query: string): Promise<{
    lat: number;
    lng: number;
    displayName: string;
  } | null> {
    const q = query.trim();
    if (q.length < 3) {
      return null;
    }
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const userAgent =
      process.env.GEOCODING_USER_AGENT?.trim() ||
      'logix/1.0 (internal logistics; contact IT)';

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': userAgent,
          'Accept-Language': 'ru,en',
        },
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      const first = data?.[0];
      if (!first) {
        return null;
      }
      const lat = Number.parseFloat(first.lat);
      const lng = Number.parseFloat(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      return {
        lat,
        lng,
        displayName: first.display_name,
      };
    } catch (e) {
      this.logger.warn(`Geocoding failed: ${e instanceof Error ? e.message : e}`);
      return null;
    }
  }
}
