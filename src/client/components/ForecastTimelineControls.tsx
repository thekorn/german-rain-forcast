interface ForecastTimelineControlsProps {
  times: string[];
  selectedTimeIndex: number;
  isPlaying: boolean;
  onSelectTime: (index: number) => void;
  onTogglePlayback: () => void;
}

export function ForecastTimelineControls(props: ForecastTimelineControlsProps) {
  const hasTimes = () => props.times.length > 0;
  const canPlay = () => props.times.length > 1;
  const selectedTime = () => props.times[props.selectedTimeIndex];
  const playbackLabel = () => (props.isPlaying ? 'Animation pausieren' : 'Animation starten');

  return (
    <section class="absolute inset-x-4 bottom-4 z-10 border-t-[6px] border-[#e30613] bg-white/96 p-4 shadow-[0_18px_45px_rgba(4,29,66,0.22)] ring-1 ring-slate-900/10 backdrop-blur sm:inset-x-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          aria-label={playbackLabel()}
          aria-pressed={props.isPlaying}
          class="flex min-w-14 items-center justify-center bg-[#e30613] px-5 py-2 text-sm font-black tracking-[0.08em] text-white uppercase shadow-lg shadow-red-950/20 transition hover:bg-[#c7000b] focus:ring-2 focus:ring-[#072f6b] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          disabled={!canPlay()}
          type="button"
          onClick={props.onTogglePlayback}
        >
          <svg
            aria-hidden="true"
            class="h-7 w-7"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            {props.isPlaying ? (
              <path d="M7.5 5.5h3.5v13h-3.5zM13 5.5h3.5v13H13z" />
            ) : (
              <path d="M8.75 5.5v13l10.5-6.5z" />
            )}
          </svg>
        </button>
        <label class="sr-only" for="forecast-time">
          Prognosezeitpunkt
        </label>
        <input
          id="forecast-time"
          class="forecast-range h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#e30613] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasTimes()}
          max={Math.max(props.times.length - 1, 0)}
          min="0"
          type="range"
          value={props.selectedTimeIndex}
          onInput={(event) => props.onSelectTime(Number(event.currentTarget.value))}
        />
        <p class="min-w-56 text-left text-sm font-black text-[#041d42] sm:text-right">
          {selectedTime() ? formatForecastTime(selectedTime() ?? '') : 'Keine Prognosezeitpunkte'}
        </p>
      </div>
    </section>
  );
}

function formatForecastTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);

  if (!match) {
    return value;
  }

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)),
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return (
    new Intl.DateTimeFormat('de-DE', {
      timeZone: 'UTC',
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' Uhr'
  );
}
