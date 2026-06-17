export function ForecastTimelineControls() {
  return (
    <section class="absolute inset-x-4 bottom-4 rounded-3xl bg-slate-950/85 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <div class="flex items-center gap-4">
        <button
          class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg"
          type="button"
        >
          Play
        </button>
        <div class="h-2 flex-1 rounded-full bg-white/20">
          <div class="h-full w-1/4 rounded-full bg-sky-300" />
        </div>
        <p class="w-36 text-right text-sm text-slate-200">Timeline reserved</p>
      </div>
    </section>
  );
}
