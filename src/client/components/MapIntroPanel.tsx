import type { RainForecastResponse } from '../forecast.ts';

interface MapIntroPanelProps {
  forecast?: RainForecastResponse;
  loading: boolean;
  error?: unknown;
}

export function MapIntroPanel(props: MapIntroPanelProps) {
  return (
    <section class="pointer-events-none absolute top-4 left-4 max-w-sm rounded-2xl bg-slate-950/80 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <p class="text-xs font-semibold tracking-[0.25em] text-sky-200 uppercase">
        German Rain Forecast
      </p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight">DWD ICON precipitation map</h1>
      <p class="mt-2 text-sm leading-6 text-slate-200">
        Hourly precipitation forecast from the DWD ICON model, rendered from cached server data.
      </p>
      <p class="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-100">
        {statusMessage(props)}
      </p>
      {props.forecast?.refresh.lastError ? (
        <p class="mt-2 text-xs leading-5 text-amber-200">
          Last refresh error: {props.forecast.refresh.lastError}
        </p>
      ) : null}
    </section>
  );
}

function statusMessage(props: MapIntroPanelProps): string {
  if (props.loading) {
    return 'Loading cached forecast data…';
  }

  if (props.error) {
    return props.error instanceof Error ? props.error.message : 'Rain forecast data is unavailable';
  }

  if (
    !props.forecast ||
    props.forecast.times.length === 0 ||
    props.forecast.gridPoints.length === 0
  ) {
    return 'No forecast data is currently available.';
  }

  const status =
    props.forecast.refresh.status === 'fresh' ? 'cached' : props.forecast.refresh.status;
  return `${props.forecast.times.length} timesteps loaded from ${status} data, updated ${formatCacheTime(props.forecast.cache.updatedAt)}.`;
}

function formatCacheTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
