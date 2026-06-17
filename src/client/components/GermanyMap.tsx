import maplibregl, { type LngLatBoundsLike, type Map } from 'maplibre-gl';
import { onCleanup, onMount } from 'solid-js';

const GERMANY_CENTER: [number, number] = [10.45, 51.16];
const GERMANY_BOUNDS: LngLatBoundsLike = [
  [5.5, 47],
  [15.6, 55.2],
];
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export function GermanyMap() {
  let mapContainer: HTMLDivElement | undefined;
  let map: Map | undefined;

  onMount(() => {
    if (!mapContainer) return;

    map = new maplibregl.Map({
      container: mapContainer,
      style: MAP_STYLE_URL,
      center: GERMANY_CENTER,
      zoom: 5.4,
      minZoom: 4,
      maxBounds: GERMANY_BOUNDS,
      attributionControl: { compact: true },
    });
  });

  onCleanup(() => {
    map?.remove();
    map = undefined;
  });

  return (
    <div
      ref={(element) => {
        mapContainer = element;
      }}
      aria-label="Map of Germany"
      class="absolute inset-0"
      role="region"
    />
  );
}
