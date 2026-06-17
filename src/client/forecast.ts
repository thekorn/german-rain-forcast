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
