import { describe, expect, test } from 'bun:test';
import {
  getWettestForecastTimeIndex,
  rainForecastToGeoJson,
  type RainForecastResponse,
} from './forecast.ts';

describe('rainForecastToGeoJson', () => {
  test('maps the selected timestep precipitation values to GeoJSON point features', () => {
    const geoJson = rainForecastToGeoJson(createForecast(), 1);

    expect(geoJson).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [6, 47],
          },
          properties: {
            precipitation: 1.4,
            time: '2026-06-17T10:00:00',
            latitude: 47,
            longitude: 6,
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [7.5, 48.25],
          },
          properties: {
            precipitation: 8.2,
            time: '2026-06-17T10:00:00',
            latitude: 48.25,
            longitude: 7.5,
          },
        },
      ],
    });
  });

  test('rejects invalid timestep and mismatched forecast shapes', () => {
    expect(() => rainForecastToGeoJson(createForecast(), 2)).toThrow(
      'Forecast timestep index 2 is out of range',
    );

    expect(() =>
      rainForecastToGeoJson(
        {
          ...createForecast(),
          precipitation: [[0, 1]],
        },
        0,
      ),
    ).toThrow('Forecast grid point and precipitation arrays are mismatched');
  });
});

describe('getWettestForecastTimeIndex', () => {
  test('returns the timestep with the highest total precipitation', () => {
    expect(getWettestForecastTimeIndex(createForecast())).toBe(1);
  });

  test('falls back to the first timestep when there are no forecast times', () => {
    expect(getWettestForecastTimeIndex({ ...createForecast(), times: [], precipitation: [] })).toBe(
      0,
    );
  });
});

function createForecast(): RainForecastResponse {
  return {
    model: 'dwd-icon',
    timezone: 'Europe/Berlin',
    times: ['2026-06-17T09:00:00', '2026-06-17T10:00:00'],
    units: {
      precipitation: 'mm',
    },
    gridPoints: [
      { latitude: 47, longitude: 6 },
      { latitude: 48.25, longitude: 7.5 },
    ],
    precipitation: [
      [0, 1.4],
      [2.5, 8.2],
    ],
    cache: {
      updatedAt: '2026-06-17T08:00:00.000Z',
      expiresAt: '2026-06-17T09:00:00.000Z',
      ttlMs: 60 * 60 * 1000,
    },
    refresh: {
      status: 'fresh',
    },
  };
}
