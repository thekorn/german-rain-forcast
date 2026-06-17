import {
  forecastCache,
  type ForecastCacheSnapshot,
  type ForecastCacheService,
} from './forecast-cache.ts';

const SUCCESS_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';
const STALE_CACHE_CONTROL = 'no-cache';
const ERROR_CACHE_CONTROL = 'no-store';

interface RainForecastResponse {
  model: 'dwd-icon';
  timezone: 'Europe/Berlin';
  times: string[];
  units: {
    precipitation: 'mm';
  };
  gridPoints: ForecastCacheSnapshot['gridPoints'];
  precipitation: ForecastCacheSnapshot['precipitation'];
  cache: ForecastCacheSnapshot['cache'];
  refresh: ForecastCacheSnapshot['refresh'];
}

type ForecastProvider = Pick<ForecastCacheService, 'getForecast'>;

export async function handleRainForecastApiRequest(
  provider: ForecastProvider = forecastCache,
): Promise<Response> {
  try {
    const snapshot = await provider.getForecast();
    const response = toRainForecastResponse(snapshot);

    return Response.json(response, {
      headers: {
        'Cache-Control':
          response.refresh.status === 'stale' ? STALE_CACHE_CONTROL : SUCCESS_CACHE_CONTROL,
      },
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        error: {
          message: 'Rain forecast data is unavailable',
          detail,
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': ERROR_CACHE_CONTROL,
        },
      },
    );
  }
}

function toRainForecastResponse(snapshot: ForecastCacheSnapshot): RainForecastResponse {
  validateSnapshot(snapshot);

  return {
    model: 'dwd-icon',
    timezone: 'Europe/Berlin',
    times: snapshot.times,
    units: {
      precipitation: 'mm',
    },
    gridPoints: snapshot.gridPoints,
    precipitation: snapshot.precipitation,
    cache: snapshot.cache,
    refresh: snapshot.refresh,
  };
}

function validateSnapshot(snapshot: ForecastCacheSnapshot): void {
  if (snapshot.gridPoints.length !== snapshot.precipitation.length) {
    throw new Error('Forecast cache returned mismatched grid point and precipitation arrays');
  }

  for (const values of snapshot.precipitation) {
    if (values.length !== snapshot.times.length) {
      throw new Error('Forecast cache returned mismatched time and precipitation arrays');
    }
  }
}
