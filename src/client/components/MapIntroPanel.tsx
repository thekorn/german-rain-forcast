import type { RainForecastResponse } from '../forecast.ts';

interface MapIntroPanelProps {
  forecast?: RainForecastResponse;
  loading: boolean;
  error?: unknown;
}

export function MapIntroPanel(props: MapIntroPanelProps) {
  return (
    <section class="pointer-events-none absolute top-32 left-4 z-10 max-w-sm border-l-[6px] border-[#e30613] bg-white/94 p-5 shadow-[0_18px_45px_rgba(4,29,66,0.22)] ring-1 ring-slate-900/10 backdrop-blur-md sm:left-6">
      <p class="text-xs font-black tracking-[0.25em] text-[#e30613] uppercase">Wetterlage</p>
      <h2 class="display-font mt-2 text-3xl leading-tight font-black tracking-tight text-[#041d42]">
        Regenradar für Deutschland
      </h2>
      <p class="mt-2 text-sm leading-6 font-medium text-slate-700">
        Stündliche Niederschlagsprognose aus dem DWD-ICON-Modell, als Live-Karte aus
        zwischengespeicherten Serverdaten dargestellt.
      </p>
      <p class="mt-4 border-t-4 border-[#072f6b] bg-[#f4f6f8] px-3 py-2 text-sm font-bold text-[#041d42]">
        {statusMessage(props)}
      </p>
      {props.forecast?.refresh.lastError ? (
        <p class="mt-2 text-xs leading-5 font-semibold text-[#e30613]">
          Letzter Aktualisierungsfehler: {props.forecast.refresh.lastError}
        </p>
      ) : null}
    </section>
  );
}

function statusMessage(props: MapIntroPanelProps): string {
  if (props.loading) {
    return 'Prognosedaten werden geladen …';
  }

  if (props.error) {
    return props.error instanceof Error
      ? props.error.message
      : 'Regenradar-Daten sind derzeit nicht verfügbar';
  }

  if (
    !props.forecast ||
    props.forecast.times.length === 0 ||
    props.forecast.gridPoints.length === 0
  ) {
    return 'Zurzeit sind keine Prognosedaten verfügbar.';
  }

  const status = refreshStatusLabel(props.forecast.refresh.status);
  return `${props.forecast.times.length} Zeitschritte aus ${status} Daten geladen, aktualisiert am ${formatCacheTime(props.forecast.cache.updatedAt)}.`;
}

function refreshStatusLabel(status: RainForecastResponse['refresh']['status']): string {
  switch (status) {
    case 'fresh':
      return 'frischen';
    case 'stale':
      return 'älteren';
    case 'refreshing':
      return 'aktualisierten';
    case 'error':
      return 'fehlerhaften';
    case 'empty':
      return 'leeren';
  }
}

function formatCacheTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return (
    new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' Uhr'
  );
}
