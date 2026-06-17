import { describe, expect, test } from 'bun:test';
import { ForecastCacheService } from './forecast-cache.ts';
import { handleRainForecastApiRequest } from './rain-forecast-api.ts';

describe('rain forecast API', () => {
  test('returns normalized forecast data with client cache metadata', async () => {
    const service = new ForecastCacheService({
      fetcher: createForecastFetcher([]),
      gridPoints: [{ latitude: 47, longitude: 6 }],
      now: () => Date.UTC(2026, 5, 17, 8),
      ttlMs: 60 * 60 * 1000,
    });

    const response = await handleRainForecastApiRequest(service);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=60, stale-while-revalidate=300',
    );
    expect(body).toEqual({
      model: 'dwd-icon',
      timezone: 'Europe/Berlin',
      times: ['2026-06-17T09:00:00', '2026-06-17T10:00:00'],
      units: {
        precipitation: 'mm',
      },
      gridPoints: [{ latitude: 47, longitude: 6 }],
      precipitation: [[0, 1]],
      cache: {
        updatedAt: '2026-06-17T08:00:00.000Z',
        expiresAt: '2026-06-17T09:00:00.000Z',
        ttlMs: 60 * 60 * 1000,
      },
      refresh: {
        status: 'fresh',
        lastStartedAt: '2026-06-17T08:00:00.000Z',
        lastFinishedAt: '2026-06-17T08:00:00.000Z',
      },
    });
  });

  test('uses the backend cache service instead of calling upstream per API request', async () => {
    const requests: URL[] = [];
    const service = new ForecastCacheService({
      fetcher: createForecastFetcher(requests),
      gridPoints: [{ latitude: 47, longitude: 6 }],
      now: () => Date.UTC(2026, 5, 17, 8),
      ttlMs: 60 * 60 * 1000,
    });

    await handleRainForecastApiRequest(service);
    await handleRainForecastApiRequest(service);

    expect(requests).toHaveLength(1);
  });

  test('returns stale cached data when refresh fails after expiry', async () => {
    let now = Date.UTC(2026, 5, 17, 8);
    let fail = false;
    const service = new ForecastCacheService({
      fetcher: async (input) => {
        if (fail) {
          return Response.json({ reason: 'upstream unavailable' }, { status: 503 });
        }

        return createForecastFetcher([])(input);
      },
      gridPoints: [{ latitude: 47, longitude: 6 }],
      now: () => now,
      ttlMs: 1000,
    });

    await handleRainForecastApiRequest(service);
    now += 1001;
    fail = true;
    const response = await handleRainForecastApiRequest(service);
    const body = (await response.json()) as RainForecastApiTestBody;

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(body.refresh.status).toBe('stale');
    expect(body.refresh.lastError).toBe('Open-Meteo request failed with HTTP 503');
    expect(body.precipitation).toEqual([[0, 1]]);
  });

  test('returns a proper error response when no forecast data is available', async () => {
    const service = new ForecastCacheService({
      fetcher: async () => Response.json({ reason: 'upstream unavailable' }, { status: 503 }),
      gridPoints: [{ latitude: 47, longitude: 6 }],
    });

    const response = await handleRainForecastApiRequest(service);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body).toEqual({
      error: {
        message: 'Rain forecast data is unavailable',
        detail: 'Open-Meteo request failed with HTTP 503',
      },
    });
  });

  test('rejects invalid cache snapshots before exposing them to clients', async () => {
    const response = await handleRainForecastApiRequest({
      async getForecast() {
        return {
          times: ['2026-06-17T09:00:00'],
          gridPoints: [{ latitude: 47, longitude: 6 }],
          precipitation: [],
          cache: {
            updatedAt: '2026-06-17T08:00:00.000Z',
            expiresAt: '2026-06-17T09:00:00.000Z',
            ttlMs: 60 * 60 * 1000,
          },
          refresh: {
            status: 'fresh',
          },
        };
      },
    });
    const body = (await response.json()) as ErrorTestBody;

    expect(response.status).toBe(503);
    expect(body.error.detail).toBe(
      'Forecast cache returned mismatched grid point and precipitation arrays',
    );
  });
});

interface RainForecastApiTestBody {
  refresh: {
    status: string;
    lastError?: string;
  };
  precipitation: number[][];
}

interface ErrorTestBody {
  error: {
    detail: string;
  };
}

function createForecastFetcher(
  requests: URL[],
): (input: string | URL | Request) => Promise<Response> {
  return async (input) => {
    const url = input instanceof Request ? new URL(input.url) : new URL(input);
    requests.push(url);
    const latitudes = coordinates(url, 'latitude');
    const longitudes = coordinates(url, 'longitude');

    const forecasts = latitudes.map((latitude, index) => ({
      latitude,
      longitude: longitudes[index] ?? 0,
      hourly: {
        time: ['2026-06-17T09:00', '2026-06-17T10:00'],
        precipitation: [index * 2, index * 2 + 1],
      },
    }));

    return Response.json(forecasts.length === 1 ? forecasts[0] : forecasts);
  };
}

function coordinates(url: URL, name: 'latitude' | 'longitude'): number[] {
  return (url.searchParams.get(name) ?? '').split(',').map(Number);
}
