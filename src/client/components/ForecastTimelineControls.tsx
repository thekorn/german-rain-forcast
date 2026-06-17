interface ForecastTimelineControlsProps {
  times: string[];
  selectedTimeIndex: number;
  onSelectTime: (index: number) => void;
}

export function ForecastTimelineControls(props: ForecastTimelineControlsProps) {
  const hasTimes = () => props.times.length > 0;
  const selectedTime = () => props.times[props.selectedTimeIndex];

  return (
    <section class="absolute inset-x-4 bottom-4 rounded-3xl bg-slate-950/85 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20"
          disabled
          type="button"
        >
          Playback soon
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
