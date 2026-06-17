export function ForecastLegend() {
  return (
    <aside class="pointer-events-none absolute top-4 right-4 w-44 rounded-2xl bg-slate-950/80 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <h2 class="text-sm font-semibold">Rain intensity</h2>
      <div
        class="mt-3 h-3 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #bae6fd, #38bdf8, #2563eb, #7c3aed, #e11d48)',
        }}
      />
      <div class="mt-2 flex justify-between text-xs text-slate-300">
        <span>0 mm</span>
        <span>15+ mm</span>
      </div>
      <p class="mt-2 text-xs leading-5 text-slate-400">
        Blue marks light rain, purple and red mark heavy precipitation.
      </p>
    </aside>
  );
}
