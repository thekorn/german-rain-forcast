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

const GRID_CELL_INTERPOLATION_STEPS = 4;

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
  const features = forecast.gridPoints.map((point, index) => {
    const precipitation = forecast.precipitation[index]?.[timeIndex];

    if (typeof precipitation !== 'number') {
      throw new Error('Forecast precipitation value is missing for selected timestep');
    }

    return createForecastFeature(point.latitude, point.longitude, precipitation, time);
  });

  return {
    type: 'FeatureCollection',
    features: interpolateForecastGrid(features),
  };
}

function interpolateForecastGrid(features: ForecastPointFeature[]): ForecastPointFeature[] {
  if (features.length < 4) return features;

  const latitudes = [...new Set(features.map((feature) => feature.properties.latitude))].sort(
    (left, right) => left - right,
  );
  const longitudes = [...new Set(features.map((feature) => feature.properties.longitude))].sort(
    (left, right) => left - right,
  );

  if (latitudes.length < 2 || longitudes.length < 2) return features;

  const featureByCoordinate = new Map(
    features.map((feature) => [
      toCoordinateKey(feature.properties.latitude, feature.properties.longitude),
      feature,
    ]),
  );
  const interpolatedByCoordinate = new Map(
    features.map((feature) => [
      toCoordinateKey(feature.properties.latitude, feature.properties.longitude),
      feature,
    ]),
  );

  for (let latitudeIndex = 0; latitudeIndex < latitudes.length - 1; latitudeIndex += 1) {
    const southLatitude = latitudes[latitudeIndex] ?? 0;
    const northLatitude = latitudes[latitudeIndex + 1] ?? 0;

    for (let longitudeIndex = 0; longitudeIndex < longitudes.length - 1; longitudeIndex += 1) {
      const westLongitude = longitudes[longitudeIndex] ?? 0;
      const eastLongitude = longitudes[longitudeIndex + 1] ?? 0;
      const southWest = featureByCoordinate.get(toCoordinateKey(southLatitude, westLongitude));
      const southEast = featureByCoordinate.get(toCoordinateKey(southLatitude, eastLongitude));
      const northWest = featureByCoordinate.get(toCoordinateKey(northLatitude, westLongitude));
      const northEast = featureByCoordinate.get(toCoordinateKey(northLatitude, eastLongitude));

      if (!southWest || !southEast || !northWest || !northEast) continue;

      for (let latitudeStep = 0; latitudeStep <= GRID_CELL_INTERPOLATION_STEPS; latitudeStep += 1) {
        const latitudeFraction = latitudeStep / GRID_CELL_INTERPOLATION_STEPS;
        const latitude = interpolateNumber(southLatitude, northLatitude, latitudeFraction);

        for (
          let longitudeStep = 0;
          longitudeStep <= GRID_CELL_INTERPOLATION_STEPS;
          longitudeStep += 1
        ) {
          const longitudeFraction = longitudeStep / GRID_CELL_INTERPOLATION_STEPS;
          const longitude = interpolateNumber(westLongitude, eastLongitude, longitudeFraction);
          const key = toCoordinateKey(latitude, longitude);

          if (interpolatedByCoordinate.has(key)) continue;

          interpolatedByCoordinate.set(
            key,
            createForecastFeature(
              roundCoordinate(latitude),
              roundCoordinate(longitude),
              interpolateGridPrecipitation(
                southWest.properties.precipitation,
                southEast.properties.precipitation,
                northWest.properties.precipitation,
                northEast.properties.precipitation,
                latitudeFraction,
                longitudeFraction,
              ),
              southWest.properties.time,
            ),
          );
        }
      }
    }
  }

  return [...interpolatedByCoordinate.values()];
}

function interpolateGridPrecipitation(
  southWest: number,
  southEast: number,
  northWest: number,
  northEast: number,
  latitudeFraction: number,
  longitudeFraction: number,
): number {
  const south = interpolateNumber(southWest, southEast, longitudeFraction);
  const north = interpolateNumber(northWest, northEast, longitudeFraction);

  return interpolateNumber(south, north, latitudeFraction);
}

function interpolateNumber(start: number, end: number, fraction: number): number {
  return start + (end - start) * fraction;
}

function createForecastFeature(
  latitude: number,
  longitude: number,
  precipitation: number,
  time: string,
): ForecastPointFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    properties: {
      precipitation,
      time,
      latitude,
      longitude,
    },
  };
}

function toCoordinateKey(latitude: number, longitude: number): string {
  return `${roundCoordinate(latitude)},${roundCoordinate(longitude)}`;
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
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
