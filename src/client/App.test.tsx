import type { RouteSectionProps } from '@solidjs/router';
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';

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

class MockMap {
  removed = false;

  constructor(readonly options: MapOptions) {
    mapInstances.push(this);
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
  createConnection: () => {
    const [error] = createSignal<string | null>(null);
    const [connected] = createSignal(false);
    return { error, connected };
  },
}));

mock.module('maplibre-gl', () => ({
  default: {
    Map: MockMap,
  },
}));

const App = (await import('./App.tsx')).default;

describe('App', () => {
  beforeEach(() => {
    mapInstances.length = 0;
  });

  test('renders the Germany map shell', () => {
    render(() => <App {...stubRouteProps} />);
    expect(screen.getByRole('region', { name: 'Map of Germany' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'DWD ICON precipitation map' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Legend' })).toBeInTheDocument();
    expect(screen.getByText('Timeline reserved')).toBeInTheDocument();
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
});
