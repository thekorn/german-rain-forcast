import { describe, expect, test } from 'bun:test';
import { ForecastCacheService, generateGermanyForecastGrid } from './forecast-cache.ts';

describe('ForecastCacheService', () => {
  test('fetches DWD ICON precipitation and returns normalized cache snapshots', async () => {
    let now = Date.UTC(2026, 5, 17, 8);
    const requests: URL[] = [];
    const gridPoints = [
      { latitude: 47, longitude: 6 },
      { latitude: 48, longitude: 7 },
    ];
    const service = new ForecastCacheService({
      fetcher: createForecastFetcher(requests),
      gridPoints,
      now: () => now,
      ttlMs: 60 * 60 * 1000,
    });

    const snapshot = await service.getForecast();

    expect(requests).toHaveLength(1);
    const request = requests[0];
    expect(request).toBeDefined();
    if (!request) {
      throw new Error('expected one Open-Meteo request');
    }
    expect(request.origin + request.pathname).toBe('https://api.open-meteo.com/v1/dwd-icon');
    expect(request.searchParams.get('hourly')).toBe('precipitation');
    expect(request.searchParams.get('timezone')).toBe('Europe/Berlin');
    expect(request.searchParams.get('latitude')).toBe('47,48');
    expect(request.searchParams.get('longitude')).toBe('6,7');
    expect(snapshot).toMatchObject({
      times: ['2026-06-17T09:00:00', '2026-06-17T10:00:00'],
      gridPoints,
      precipitation: [
        [0, 1],
        [2, 3],
      ],
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

    now += 30 * 60 * 1000;
    const cachedSnapshot = await service.getForecast();

    expect(requests).toHaveLength(1);
    expect(cachedSnapshot.refresh.status).toBe('fresh');
  });

  test('chunks grid points to keep upstream requests bounded', async () => {
    const requests: URL[] = [];
    const service = new ForecastCacheService({
      fetcher: createForecastFetcher(requests),
      gridPoints: [
        { latitude: 47, longitude: 6 },
        { latitude: 48, longitude: 7 },
        { latitude: 49, longitude: 8 },
      ],
      batchSize: 2,
    });

    await service.getForecast();

    expect(requests).toHaveLength(2);
    expect(requests[0]?.searchParams.get('latitude')).toBe('47,48');
    expect(requests[1]?.searchParams.get('latitude')).toBe('49');
  });

  test('rejects invalid cache options', () => {
    expect(() => new ForecastCacheService({ ttlMs: 0 })).toThrow(
      'ttlMs must be a positive finite number',
    );
    expect(() => new ForecastCacheService({ batchSize: 0 })).toThrow(
      'batchSize must be a positive integer',
    );
  });

  test('serves stale data and reports refresh errors when an expired refresh fails', async () => {
    let now = Date.UTC(2026, 5, 17, 8);
    let fail = false;
    const requests: URL[] = [];
    const service = new ForecastCacheService({
      fetcher: async (input) => {
        if (fail) {
          return Response.json({ reason: 'upstream unavailable' }, { status: 503 });
        }

        return createForecastFetcher(requests)(input);
      },
      gridPoints: [{ latitude: 47, longitude: 6 }],
      now: () => now,
      ttlMs: 1000,
    });

    const fresh = await service.getForecast();
    expect(fresh.refresh.status).toBe('fresh');

    now += 1001;
    fail = true;
    const stale = await service.getForecast();

    expect(stale.refresh.status).toBe('stale');
    expect(stale.refresh.lastError).toBe('Open-Meteo request failed with HTTP 503');
    expect(stale.cache.updatedAt).toBe('2026-06-17T08:00:00.000Z');
    expect(stale.precipitation).toEqual([[0, 1]]);
  });

  test('generates a reusable grid covering Germany', () => {
    const grid = generateGermanyForecastGrid();

    expect(grid).toHaveLength(90);
    expect(grid[0]).toEqual({ latitude: 47, longitude: 6 });
    expect(grid.at(-1)).toEqual({ latitude: 55, longitude: 15 });
  });

  test('rejects invalid grid steps', () => {
    expect(() => generateGermanyForecastGrid(0)).toThrow('step must be a positive finite number');
  });
});

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
