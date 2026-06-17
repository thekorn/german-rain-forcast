interface ForecastTimelineControlsProps {
  times: string[];
  selectedTimeIndex: number;
  isPlaying: boolean;
  onSelectTime: (index: number) => void;
  onTogglePlayback: () => void;
}

export function ForecastTimelineControls(props: ForecastTimelineControlsProps) {
  const hasTimes = () => props.times.length > 0;
  const selectedTime = () => props.times[props.selectedTimeIndex];
  const playbackLabel = () =>
    props.isPlaying ? 'Pause forecast playback' : 'Play forecast playback';

  return (
    <section class="absolute inset-x-4 bottom-4 rounded-3xl bg-slate-950/85 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          aria-label={playbackLabel()}
          class="rounded-full bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg ring-1 shadow-sky-950/30 ring-white/25 transition hover:bg-sky-200 focus:ring-2 focus:ring-sky-100 focus:outline-none disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
          disabled={!hasTimes()}
          type="button"
          onClick={props.onTogglePlayback}
        >
          {props.isPlaying ? 'Pause' : 'Play'}
        </button>
        <label class="sr-only" for="forecast-time">
          Forecast timestep
        </label>
        <input
          id="forecast-time"
          class="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasTimes()}
          max={Math.max(props.times.length - 1, 0)}
          min="0"
          type="range"
          value={props.selectedTimeIndex}
          onInput={(event) => props.onSelectTime(Number(event.currentTarget.value))}
        />
        <p class="min-w-48 text-left text-sm text-slate-200 sm:text-right">
          {selectedTime() ? formatForecastTime(selectedTime() ?? '') : 'No forecast timesteps'}
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
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' Europe/Berlin'
  );
}
