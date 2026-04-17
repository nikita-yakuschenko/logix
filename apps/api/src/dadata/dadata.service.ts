import { Injectable, Logger } from '@nestjs/common';

const SUGGEST_URL =
  'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';

export type AddressSuggestionItem = {
  value: string;
  unrestrictedValue: string;
  lat: number | null;
  lng: number | null;
};

@Injectable()
export class DadataService {
  private readonly logger = new Logger(DadataService.name);

  /** Подсказки адреса (КЛАДР/ФИАС). Без ключа — пустой список. */
  async suggestAddress(query: string): Promise<{
    suggestions: AddressSuggestionItem[];
    configured: boolean;
  }> {
    const q = query.trim();
    if (q.length < 2) {
      return { suggestions: [], configured: this.isConfigured() };
    }

    const token = process.env.DADATA_API_KEY?.trim();
    if (!token) {
      return { suggestions: [], configured: false };
    }

    try {
      const res = await fetch(SUGGEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ query: q, count: 12 }),
      });
      if (!res.ok) {
        this.logger.warn(`Dadata suggest HTTP ${res.status}`);
        return { suggestions: [], configured: true };
      }
      const json = (await res.json()) as {
        suggestions?: Array<{
          value: string;
          unrestricted_value?: string;
          data?: { geo_lat?: unknown; geo_lon?: unknown };
        }>;
      };
      const raw = json.suggestions ?? [];
      const suggestions: AddressSuggestionItem[] = raw.map((s) => {
        const d = s.data;
        let lat: number | null = null;
        let lng: number | null = null;
        if (d?.geo_lat != null) {
          const x = Number.parseFloat(String(d.geo_lat));
          if (Number.isFinite(x)) lat = x;
        }
        if (d?.geo_lon != null) {
          const x = Number.parseFloat(String(d.geo_lon));
          if (Number.isFinite(x)) lng = x;
        }
        return {
          value: s.value,
          unrestrictedValue: s.unrestricted_value ?? s.value,
          lat,
          lng,
        };
      });
      return { suggestions, configured: true };
    } catch (e) {
      this.logger.warn(
        `Dadata suggest failed: ${e instanceof Error ? e.message : e}`,
      );
      return { suggestions: [], configured: true };
    }
  }

  private isConfigured(): boolean {
    return Boolean(process.env.DADATA_API_KEY?.trim());
  }
}
