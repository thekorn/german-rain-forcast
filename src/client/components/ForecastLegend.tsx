export function ForecastLegend() {
  return (
    <aside class="pointer-events-none absolute top-4 right-4 w-44 rounded-2xl bg-slate-950/80 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <h2 class="text-sm font-semibold">Legend</h2>
      <div class="mt-3 h-3 rounded-full bg-gradient-to-r from-sky-200 via-blue-500 to-violet-700" />
      <div class="mt-2 flex justify-between text-xs text-slate-300">
        <span>Dry</span>
        <span>Heavy</span>
      </div>
    </aside>
  );
}
