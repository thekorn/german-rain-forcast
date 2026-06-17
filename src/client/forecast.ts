export interface ForecastGridPoint {
  latitude: number;
  longitude: number;
}

export interface RainForecastResponse {
  model: 'dwd-icon';
  timezone: 'Europe/Berlin';
  times: string[];
  units: {
    precipitation: 'mm';
  };
  gridPoints: ForecastGridPoint[];
  precipitation: number[][];
  cache: {
    updatedAt: string;
    expiresAt: string;
    ttlMs: number;
  };
  refresh: {
    status: 'empty' | 'fresh' | 'stale' | 'refreshing' | 'error';
    lastStartedAt?: string;
    lastFinishedAt?: string;
    lastError?: string;
  };
}

export interface ForecastPointProperties {
  precipitation: number;
  time: string;
  latitude: number;
  longitude: number;
}

export interface ForecastPointFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: ForecastPointProperties;
}

export interface ForecastFeatureCollection {
  type: 'FeatureCollection';
  features: ForecastPointFeature[];
}

export function rainForecastToGeoJson(
  forecast: RainForecastResponse,
  timeIndex: number,
): ForecastFeatureCollection {
  if (timeIndex < 0 || timeIndex >= forecast.times.length) {
    throw new Error(`Forecast timestep index ${timeIndex} is out of range`);
  }

  if (forecast.gridPoints.length !== forecast.precipitation.length) {
    throw new Error('Forecast grid point and precipitation arrays are mismatched');
  }

  const time = forecast.times[timeIndex] ?? '';

  return {
    type: 'FeatureCollection',
    features: forecast.gridPoints.map((point, index) => {
      const precipitation = forecast.precipitation[index]?.[timeIndex];

      if (typeof precipitation !== 'number') {
        throw new Error('Forecast precipitation value is missing for selected timestep');
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.longitude, point.latitude],
        },
        properties: {
          precipitation,
          time,
          latitude: point.latitude,
          longitude: point.longitude,
        },
      };
    }),
  };
}

export function getWettestForecastTimeIndex(forecast: RainForecastResponse): number {
  let wettestIndex = 0;
  let wettestTotal = -Infinity;

  for (let timeIndex = 0; timeIndex < forecast.times.length; timeIndex += 1) {
    const total = forecast.precipitation.reduce((sum, values) => sum + (values[timeIndex] ?? 0), 0);

    if (total > wettestTotal) {
      wettestTotal = total;
      wettestIndex = timeIndex;
    }
  }

  return wettestIndex;
}

export function getInitialForecastTimeIndex(times: string[], now = new Date()): number {
  if (times.length === 0) return 0;

  const nowKey = toBerlinTimeKey(now);
  const futureIndex = times.findIndex((time) => toForecastTimeKey(time) >= nowKey);

  return futureIndex === -1 ? times.length - 1 : futureIndex;
}

export function getPlayableForecastTimeIndices(times: string[], now = new Date()): number[] {
  const nowKey = toBerlinTimeKey(now);
  const indices = times
    .map((time, index) => ({ index, key: toForecastTimeKey(time) }))
    .filter(({ key }) => key >= nowKey)
    .map(({ index }) => index);

  return indices.length > 0 ? indices : times.map((_, index) => index);
}

export function getNextForecastTimeIndex(
  times: string[],
  selectedTimeIndex: number,
  now = new Date(),
): number {
  const playableIndices = getPlayableForecastTimeIndices(times, now);

  if (playableIndices.length === 0) return 0;

  const selectedPlayableIndex = playableIndices.indexOf(selectedTimeIndex);

  if (selectedPlayableIndex === -1) {
    return playableIndices[0] ?? 0;
  }

  return playableIndices[(selectedPlayableIndex + 1) % playableIndices.length] ?? 0;
}

function toForecastTimeKey(value: string): string {
  return value.slice(0, 19);
}

function toBerlinTimeKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
}
