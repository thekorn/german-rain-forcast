import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import type { StyleSpecification } from 'maplibre-gl';
import type { ForecastFeatureCollection, RainForecastResponse } from './forecast.ts';

type MapOptions = {
  container: HTMLElement;
  style: StyleSpecification;
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
  fitBoundsCalls: unknown[] = [];

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

  fitBounds(bounds: unknown, options: unknown) {
    this.fitBoundsCalls.push({ bounds, options });
  }

  remove() {
    this.removed = true;
  }
}

mock.module('./api.ts', () => ({
  fetchRainForecast: async () => createForecast(),
}));

mock.module('maplibre-gl', () => ({
  default: {
    Map: MockMap,
  },
}));

const App = (await import('./App.tsx')).default;
const { ForecastTimelineControls } = await import('./components/ForecastTimelineControls.tsx');
const { GermanyMap } = await import('./components/GermanyMap.tsx');

describe('App', () => {
  beforeEach(() => {
    mapInstances.length = 0;
  });

  test('renders the Germany map shell', async () => {
    render(() => <App />);
    const mapRegion = screen.getByRole('region', { name: 'Karte von Deutschland' });

    expect(mapRegion).toBeInTheDocument();
    expect(mapRegion).toHaveClass('absolute', 'inset-0');
    expect(screen.getByRole('heading', { name: 'Regenradar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Regenradar für Deutschland' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Niederschlag' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Animation starten' })).toBeInTheDocument();
  });

  test('binds the timeline slider and playback button to forecast state', async () => {
    render(() => <App />);

    const [map] = mapInstances;

    await waitFor(() => {
      expect(map?.getSource('rain-forecast')?.data.features[0]?.properties.precipitation).toBe(1);
    });

    const slider = screen.getByRole('slider', { name: 'Prognosezeitpunkt' });
    fireEvent.input(slider, { target: { value: '1' } });

    await waitFor(() => {
      expect(map?.getSource('rain-forecast')?.data.features[0]?.properties.precipitation).toBe(3);
    });

    const playButton = screen.getByRole('button', { name: 'Animation starten' });
    expect(playButton).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(playButton);
    expect(screen.getByRole('button', { name: 'Animation pausieren' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Animation pausieren' }));
    expect(screen.getByRole('button', { name: 'Animation starten' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('creates one playback interval and clears it on pause and unmount', async () => {
    const { unmount } = render(() => <App />);
    const playButton = screen.getByRole('button', { name: 'Animation starten' });

    await waitFor(() => {
      expect(playButton).toBeEnabled();
    });

    const originalSetInterval = globalThis.setInterval;
    const originalClearInterval = globalThis.clearInterval;
    const intervalCalls: { callback: TimerHandler; delay?: number }[] = [];
    const clearIntervalCalls: unknown[] = [];
    let nextTimerId = 0;

    globalThis.setInterval = ((callback: TimerHandler, delay?: number) => {
      intervalCalls.push({ callback, delay });
      nextTimerId += 1;
      return nextTimerId;
    }) as typeof globalThis.setInterval;
    globalThis.clearInterval = ((timer?: unknown) => {
      clearIntervalCalls.push(timer);
    }) as typeof globalThis.clearInterval;

    try {
      fireEvent.click(playButton);

      expect(intervalCalls).toHaveLength(1);
      expect(intervalCalls[0]?.delay).toBe(700);
      expect(clearIntervalCalls).toHaveLength(0);

      fireEvent.click(screen.getByRole('button', { name: 'Animation pausieren' }));
      expect(clearIntervalCalls).toEqual([1]);

      fireEvent.click(screen.getByRole('button', { name: 'Animation starten' }));
      expect(intervalCalls).toHaveLength(2);

      unmount();
      expect(clearIntervalCalls).toEqual([1, 2]);
    } finally {
      globalThis.setInterval = originalSetInterval;
      globalThis.clearInterval = originalClearInterval;
    }
  });

  test('disables playback until there are at least two timesteps', () => {
    render(() => (
      <ForecastTimelineControls
        isPlaying={false}
        selectedTimeIndex={0}
        times={['2099-06-17T09:00:00']}
        onSelectTime={() => {}}
        onTogglePlayback={() => {}}
      />
    ));

    expect(screen.getByRole('button', { name: 'Animation starten' })).toBeDisabled();
    expect(screen.getByRole('slider', { name: 'Prognosezeitpunkt' })).toBeEnabled();
  });

  test('initializes a Germany-centered MapLibre map and cleans it up', () => {
    const { unmount } = render(() => <App />);
    expect(mapInstances).toHaveLength(1);

    const [map] = mapInstances;
    expect(map?.options.style.layers.map((layer) => layer.id)).toEqual([
      'background',
      'water',
      'major-rivers',
      'country-outline',
      'state-outline',
      'city-labels',
      'country-labels',
    ]);
    expect(map?.options.center).toEqual([10.45, 51.16]);
    expect(map?.options.zoom).toBe(4.6);
    expect(map?.options.minZoom).toBe(3.8);
    expect(map?.options.maxBounds).toEqual([
      [-2, 43],
      [23, 58],
    ]);
    expect(map?.fitBoundsCalls).toEqual([
      {
        bounds: [
          [4.2, 46.8],
          [16.2, 55.4],
        ],
        options: { duration: 0, padding: 72 },
      },
    ]);
    expect(map?.options.container).toHaveClass('h-full', 'w-full');
    expect(map?.options.container).not.toBe(
      screen.getByRole('region', { name: 'Karte von Deutschland' }),
    );

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
    expect(map?.layers).toEqual([
      expect.objectContaining({ id: 'rain-forecast-cloud', type: 'heatmap' }),
      expect.objectContaining({ id: 'rain-forecast-core', type: 'heatmap' }),
    ]);
  });

  test('renders an empty forecast overlay for empty data or an out-of-range timestep', async () => {
    const [timeIndex, setTimeIndex] = createSignal(0);
    const [forecast, setForecast] = createSignal<RainForecastResponse | undefined>(
      createEmptyForecast(),
    );

    render(() => <GermanyMap forecast={forecast()} selectedTimeIndex={timeIndex()} />);
    expect(mapInstances).toHaveLength(1);

    const [map] = mapInstances;
    expect(map?.getSource('rain-forecast')?.data.features).toHaveLength(0);

    setForecast(createForecast());
    setTimeIndex(99);

    await waitFor(() => {
      expect(map?.getSource('rain-forecast')?.data.features).toHaveLength(0);
    });
    expect(mapInstances).toHaveLength(1);
  });
});

function createForecast(): RainForecastResponse {
  return {
    model: 'dwd-icon',
    timezone: 'Europe/Berlin',
    times: ['2099-06-17T09:00:00', '2099-06-17T10:00:00'],
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

function createEmptyForecast(): RainForecastResponse {
  return {
    ...createForecast(),
    times: [],
    gridPoints: [],
    precipitation: [],
    refresh: {
      status: 'empty',
    },
  };
}
