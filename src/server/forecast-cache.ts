const DWD_ICON_ENDPOINT = 'https://api.open-meteo.com/v1/dwd-icon';
const DEFAULT_TTL_MS = 60 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 25;

export type ForecastRefreshStatus = 'empty' | 'fresh' | 'stale' | 'refreshing' | 'error';

export interface ForecastGridPoint {
  latitude: number;
  longitude: number;
}

export interface ForecastCacheSnapshot {
  times: string[];
  gridPoints: ForecastGridPoint[];
  precipitation: number[][];
  cache: {
    updatedAt: string;
    expiresAt: string;
    ttlMs: number;
  };
  refresh: {
    status: ForecastRefreshStatus;
    lastStartedAt?: string;
    lastFinishedAt?: string;
    lastError?: string;
  };
}

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type Now = () => number;

interface ForecastCacheServiceOptions {
  fetcher?: Fetcher;
  now?: Now;
  ttlMs?: number;
  batchSize?: number;
  gridPoints?: ForecastGridPoint[];
  endpoint?: string;
}

interface CachedForecast {
  times: string[];
  gridPoints: ForecastGridPoint[];
  precipitation: number[][];
  updatedAtMs: number;
}

interface RefreshState {
  status: ForecastRefreshStatus;
  lastStartedAtMs?: number;
  lastFinishedAtMs?: number;
  lastError?: string;
}

interface OpenMeteoForecast {
  latitude: number;
  longitude: number;
  hourly?: {
    time?: unknown;
    precipitation?: unknown;
  };
}

export class ForecastCacheService {
  private readonly fetcher: Fetcher;
  private readonly now: Now;
  private readonly ttlMs: number;
  private readonly batchSize: number;
  private readonly gridPoints: ForecastGridPoint[];
  private readonly endpoint: string;
  private cache?: CachedForecast;
  private refreshPromise?: Promise<ForecastCacheSnapshot>;
  private refreshState: RefreshState = { status: 'empty' };

  constructor(options: ForecastCacheServiceOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? Date.now;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    this.gridPoints = options.gridPoints ?? generateGermanyForecastGrid();
    this.endpoint = options.endpoint ?? DWD_ICON_ENDPOINT;
  }

  async getForecast(): Promise<ForecastCacheSnapshot> {
    if (this.cache && this.isFresh(this.cache)) {
      return this.toSnapshot(this.cache, 'fresh');
    }

    if (this.refreshPromise) {
      return this.cache ? this.toSnapshot(this.cache, 'refreshing') : this.refreshPromise;
    }

    return this.refresh();
  }

  async refresh(): Promise<ForecastCacheSnapshot> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const startedAtMs = this.now();
    this.refreshState = {
      status: 'refreshing',
      lastStartedAtMs: startedAtMs,
      lastFinishedAtMs: this.refreshState.lastFinishedAtMs,
      lastError: this.refreshState.lastError,
    };

    this.refreshPromise = this.fetchForecast()
      .then((forecast) => {
        this.cache = { ...forecast, updatedAtMs: this.now() };
        this.refreshState = {
          status: 'fresh',
          lastStartedAtMs: startedAtMs,
          lastFinishedAtMs: this.now(),
        };
        return this.toSnapshot(this.cache, 'fresh');
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.refreshState = {
          status: 'error',
          lastStartedAtMs: startedAtMs,
          lastFinishedAtMs: this.now(),
          lastError: message,
        };

        if (this.cache) {
          return this.toSnapshot(this.cache, 'stale');
        }

        throw error;
      })
      .finally(() => {
        this.refreshPromise = undefined;
      });

    return this.refreshPromise;
  }

  startBackgroundRefresh(options: { onError?: (error: unknown) => void } = {}): () => void {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      void this.refresh()
        .then((snapshot) => {
          if (snapshot.refresh.status === 'stale' && snapshot.refresh.lastError) {
            options.onError?.(new Error(snapshot.refresh.lastError));
          }
        })
        .catch((error: unknown) => {
          options.onError?.(error);
        })
        .finally(() => {
          if (!stopped) {
            timer = setTimeout(run, this.ttlMs);
          }
        });
    };

    run();

    return () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }

  private async fetchForecast(): Promise<Omit<CachedForecast, 'updatedAtMs'>> {
    const results: OpenMeteoForecast[] = [];

    for (const batch of chunk(this.gridPoints, this.batchSize)) {
      results.push(...(await this.fetchBatch(batch)));
    }

    if (results.length !== this.gridPoints.length) {
      throw new Error(
        `Open-Meteo returned ${results.length} forecasts for ${this.gridPoints.length} grid points`,
      );
    }

    const normalized = results.map(normalizeForecast);
    const times = normalized[0]?.times;

    if (!times) {
      throw new Error('Open-Meteo returned no forecast data');
    }

    for (const forecast of normalized) {
      if (!sameTimes(times, forecast.times)) {
        throw new Error('Open-Meteo returned inconsistent hourly time ranges');
      }
    }

    return {
      times,
      gridPoints: normalized.map((forecast) => forecast.gridPoint),
      precipitation: normalized.map((forecast) => forecast.precipitation),
    };
  }

  private async fetchBatch(batch: ForecastGridPoint[]): Promise<OpenMeteoForecast[]> {
    const url = new URL(this.endpoint);
    url.searchParams.set(
      'latitude',
      batch.map((point) => formatCoordinate(point.latitude)).join(','),
    );
    url.searchParams.set(
      'longitude',
      batch.map((point) => formatCoordinate(point.longitude)).join(','),
    );
    url.searchParams.set('hourly', 'precipitation');
    url.searchParams.set('timezone', 'Europe/Berlin');

    const response = await this.fetcher(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as OpenMeteoForecast[]) : [data as OpenMeteoForecast];
  }

  private isFresh(cache: CachedForecast): boolean {
    return this.now() - cache.updatedAtMs < this.ttlMs;
  }

  private toSnapshot(cache: CachedForecast, status: ForecastRefreshStatus): ForecastCacheSnapshot {
    return {
      times: cache.times,
      gridPoints: cache.gridPoints,
      precipitation: cache.precipitation,
      cache: {
        updatedAt: new Date(cache.updatedAtMs).toISOString(),
        expiresAt: new Date(cache.updatedAtMs + this.ttlMs).toISOString(),
        ttlMs: this.ttlMs,
      },
      refresh: {
        status,
        lastStartedAt: toIsoString(this.refreshState.lastStartedAtMs),
        lastFinishedAt: toIsoString(this.refreshState.lastFinishedAtMs),
        lastError: this.refreshState.lastError,
      },
    };
  }
}

export function generateGermanyForecastGrid(step = 1): ForecastGridPoint[] {
  const grid: ForecastGridPoint[] = [];

  for (let latitude = 47; latitude <= 55; latitude += step) {
    for (let longitude = 6; longitude <= 15; longitude += step) {
      grid.push({ latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) });
    }
  }

  return grid;
}

export const forecastCache = new ForecastCacheService();

function normalizeForecast(forecast: OpenMeteoForecast): {
  gridPoint: ForecastGridPoint;
  times: string[];
  precipitation: number[];
} {
  const times = forecast.hourly?.time;
  const precipitation = forecast.hourly?.precipitation;

  if (!Array.isArray(times) || !Array.isArray(precipitation)) {
    throw new Error('Open-Meteo response is missing hourly precipitation data');
  }

  if (times.length !== precipitation.length) {
    throw new Error('Open-Meteo response has mismatched time and precipitation arrays');
  }

  return {
    gridPoint: {
      latitude: forecast.latitude,
      longitude: forecast.longitude,
    },
    times: times.map(normalizeTime),
    precipitation: precipitation.map((value) => {
      if (typeof value !== 'number') {
        throw new Error('Open-Meteo response contains non-numeric precipitation values');
      }

      return value;
    }),
  };
}

function normalizeTime(value: unknown): string {
  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value !== 'string') {
    throw new Error('Open-Meteo response contains non-string time values');
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Open-Meteo response contains invalid time value: ${value}`);
  }

  return parsed.toISOString();
}

function sameTimes(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((time, index) => time === right[index]);
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function formatCoordinate(value: number): string {
  return roundCoordinate(value).toString();
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(4));
}

function toIsoString(value?: number): string | undefined {
  return value === undefined ? undefined : new Date(value).toISOString();
}
