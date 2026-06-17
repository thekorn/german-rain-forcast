import type { RouteSectionProps } from '@solidjs/router';
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import type { ForecastFeatureCollection, RainForecastResponse } from './forecast.ts';

type MapOptions = {
  container: HTMLElement;
  style: string;
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxBounds: [[number, number], [number, number]];
  attributionControl: { compact: boolean };
};

const mapInstances: MockMap[] = [];

interface MockGeoJsonSource {
  data: ForecastFeatureCollection;
  setData: (data: ForecastFeatureCollection) => void;
}

class MockMap {
  removed = false;
  sources = new Map<string, MockGeoJsonSource>();
  layers: unknown[] = [];

  constructor(readonly options: MapOptions) {
    mapInstances.push(this);
  }

  on(event: string, callback: () => void) {
    if (event === 'load') {
      callback();
    }
  }

  getSource(id: string) {
    return this.sources.get(id);
  }

  addSource(id: string, source: { data: ForecastFeatureCollection }) {
    this.sources.set(id, {
      data: source.data,
      setData(data) {
        this.data = data;
      },
    });
  }

  addLayer(layer: unknown) {
    this.layers.push(layer);
  }

  remove() {
    this.removed = true;
  }
}

const stubRouteProps: RouteSectionProps = {
  params: {},
  location: {
    pathname: '/',
    search: '',
    hash: '',
    query: {},
    state: null,
    key: 'test',
  },
  data: undefined,
};

mock.module('./api.ts', () => ({
  fetchRainForecast: async () => createForecast(),
}));

mock.module('maplibre-gl', () => ({
  default: {
    Map: MockMap,
  },
}));

const App = (await import('./App.tsx')).default;
const { GermanyMap } = await import('./components/GermanyMap.tsx');

describe('App', () => {
  beforeEach(() => {
    mapInstances.length = 0;
  });

  test('renders the Germany map shell', () => {
    render(() => <App {...stubRouteProps} />);
    expect(screen.getByRole('region', { name: 'Map of Germany' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'DWD ICON precipitation map' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rain intensity' })).toBeInTheDocument();
    expect(screen.getByText('Playback soon')).toBeInTheDocument();
  });

  test('initializes a Germany-centered MapLibre map and cleans it up', () => {
    const { unmount } = render(() => <App {...stubRouteProps} />);
    expect(mapInstances).toHaveLength(1);

    const [map] = mapInstances;
    expect(map?.options.style).toBe('https://tiles.openfreemap.org/styles/liberty');
    expect(map?.options.center).toEqual([10.45, 51.16]);
    expect(map?.options.zoom).toBe(5.4);
    expect(map?.options.minZoom).toBe(4);
    expect(map?.options.maxBounds).toEqual([
      [5.5, 47],
      [15.6, 55.2],
    ]);

    unmount();
    expect(map?.removed).toBe(true);
  });

  test('updates the forecast source when the selected timestep changes without rebuilding the map', async () => {
    const [timeIndex, setTimeIndex] = createSignal(0);

    render(() => <GermanyMap forecast={createForecast()} selectedTimeIndex={timeIndex()} />);
    expect(mapInstances).toHaveLength(1);

    const [map] = mapInstances;
    expect(map?.getSource('rain-forecast')?.data.features[0]?.properties.precipitation).toBe(1);
    setTimeIndex(1);

    await waitFor(() => {
      const source = map?.getSource('rain-forecast');
      expect(source?.data.features[0]?.properties.precipitation).toBe(3);
    });
    expect(mapInstances).toHaveLength(1);
    expect(map?.layers).toHaveLength(2);
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
    gridPoints: [{ latitude: 47, longitude: 6 }],
    precipitation: [[1, 3]],
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
