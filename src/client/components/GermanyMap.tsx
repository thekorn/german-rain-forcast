import maplibregl, {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type Map,
  type StyleSpecification,
} from 'maplibre-gl';
import { createEffect, onCleanup, onMount } from 'solid-js';
import {
  rainForecastToGeoJson,
  type ForecastFeatureCollection,
  type RainForecastResponse,
} from '../forecast.ts';

// cspell:ignore maxzoom minzoom OpenMapTiles

const GERMANY_CENTER: [number, number] = [10.45, 51.16];
const GERMANY_VIEW_BOUNDS: LngLatBoundsLike = [
  [4.2, 46.8],
  [16.2, 55.4],
];
const MAP_PAN_BOUNDS: LngLatBoundsLike = [
  [-2, 43],
  [23, 58],
];
const MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#dbe7de',
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': '#9fc6d4',
        'fill-opacity': 0.7,
      },
    },
    {
      id: 'major-rivers',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      filter: ['==', ['get', 'class'], 'river'],
      paint: {
        'line-color': '#79aebf',
        'line-opacity': 0.55,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.7, 6, 1.4],
      },
    },
    {
      id: 'country-outline',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
      paint: {
        'line-color': '#334155',
        'line-opacity': 0.85,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.1, 6, 1.8],
      },
    },
    {
      id: 'state-outline',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: [
        'all',
        ['>=', ['get', 'admin_level'], 3],
        ['<=', ['get', 'admin_level'], 4],
        ['!=', ['get', 'maritime'], 1],
      ],
      paint: {
        'line-color': '#64748b',
        'line-dasharray': [2, 2],
        'line-opacity': 0.35,
        'line-width': 0.8,
      },
    },
    {
      id: 'city-labels',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', ['get', 'class'], 'city'], ['<=', ['get', 'rank'], 8]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 6, 13],
      },
      paint: {
        'text-color': '#0f172a',
        'text-halo-color': '#e6efe9',
        'text-halo-width': 1.2,
      },
    },
    {
      id: 'country-labels',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['all', ['==', ['get', 'class'], 'country'], ['<=', ['get', 'rank'], 3]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-letter-spacing': 0.08,
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 6, 14],
      },
      paint: {
        'text-color': '#475569',
        'text-halo-color': '#e6efe9',
        'text-halo-width': 1.4,
      },
    },
  ],
};
const FORECAST_SOURCE_ID = 'rain-forecast';
const FORECAST_HEATMAP_LAYER_ID = 'rain-forecast-heatmap';
const FORECAST_CIRCLE_LAYER_ID = 'rain-forecast-circles';
const EMPTY_FORECAST_GEOJSON: ForecastFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

interface GermanyMapProps {
  forecast?: RainForecastResponse;
  selectedTimeIndex: number;
}

export function GermanyMap(props: GermanyMapProps) {
  let mapContainer: HTMLDivElement | undefined;
  let map: Map | undefined;
  let mapLoaded = false;
  let latestForecastGeoJson = EMPTY_FORECAST_GEOJSON;

  onMount(() => {
    if (!mapContainer) return;

    map = new maplibregl.Map({
      container: mapContainer,
      style: MAP_STYLE,
      center: GERMANY_CENTER,
      zoom: 4.6,
      minZoom: 3.8,
      maxBounds: MAP_PAN_BOUNDS,
      attributionControl: { compact: true },
    });

    map.on('load', () => {
      mapLoaded = true;
      map?.fitBounds(GERMANY_VIEW_BOUNDS, { duration: 0, padding: 72 });
      ensureForecastLayers();
      updateForecastSource();
    });
  });

  createEffect(() => {
    latestForecastGeoJson = toForecastGeoJson(props.forecast, props.selectedTimeIndex);
    updateForecastSource();
  });

  onCleanup(() => {
    map?.remove();
    map = undefined;
  });

  return (
    <div aria-label="Map of Germany" class="absolute inset-0" role="region">
      <div
        ref={(element) => {
          mapContainer = element;
        }}
        class="h-full w-full"
      />
    </div>
  );

  function ensureForecastLayers() {
    if (!map || map.getSource(FORECAST_SOURCE_ID)) return;

    map.addSource(FORECAST_SOURCE_ID, {
      type: 'geojson',
      data: latestForecastGeoJson,
    });

    map.addLayer(
      {
        id: FORECAST_HEATMAP_LAYER_ID,
        type: 'heatmap',
        source: FORECAST_SOURCE_ID,
        maxzoom: 8,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'precipitation'],
            0,
            0,
            0.5,
            0.25,
            2,
            0.65,
            8,
            1,
          ],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.9, 8, 1.8],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 24, 8, 42],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.75, 8, 0.25],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(14, 165, 233, 0)',
            0.2,
            'rgba(125, 211, 252, 0.55)',
            0.45,
            'rgba(59, 130, 246, 0.72)',
            0.7,
            'rgba(124, 58, 237, 0.82)',
            1,
            'rgba(225, 29, 72, 0.9)',
          ],
        },
      },
      'city-labels',
    );

    map.addLayer(
      {
        id: FORECAST_CIRCLE_LAYER_ID,
        type: 'circle',
        source: FORECAST_SOURCE_ID,
        minzoom: 4,
        filter: ['>', ['get', 'precipitation'], 0],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'precipitation'],
            0,
            4,
            1,
            8,
            5,
            16,
            15,
            26,
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'precipitation'],
            0,
            '#bae6fd',
            0.5,
            '#38bdf8',
            2,
            '#2563eb',
            8,
            '#7c3aed',
            15,
            '#e11d48',
          ],
          'circle-opacity': 0.85,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.75,
          'circle-stroke-width': 1,
        },
      },
      'city-labels',
    );
  }

  function updateForecastSource() {
    if (!map || !mapLoaded) return;

    ensureForecastLayers();
    const source = map.getSource(FORECAST_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(latestForecastGeoJson);
  }
}

function toForecastGeoJson(
  forecast: RainForecastResponse | undefined,
  selectedTimeIndex: number,
): ForecastFeatureCollection {
  if (
    !forecast ||
    forecast.times.length === 0 ||
    forecast.gridPoints.length === 0 ||
    selectedTimeIndex < 0 ||
    selectedTimeIndex >= forecast.times.length
  ) {
    return EMPTY_FORECAST_GEOJSON;
  }

  return rainForecastToGeoJson(forecast, selectedTimeIndex);
}
