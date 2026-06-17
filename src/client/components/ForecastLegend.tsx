export function ForecastLegend() {
  return (
    <aside class="pointer-events-none absolute top-4 right-4 w-48 rounded-3xl bg-slate-950/78 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur-md">
      <h2 class="text-sm font-semibold">Rain cloud overlay</h2>
      <div
        class="mt-3 h-5 rounded-full shadow-inner shadow-sky-950/50 blur-[0.2px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(186, 230, 253, 0.28), rgba(125, 211, 252, 0.55), rgba(37, 99, 235, 0.66), rgba(124, 58, 237, 0.72), rgba(225, 29, 72, 0.82))',
        }}
      />
      <div class="mt-2 flex justify-between text-xs text-slate-300">
        <span>0 mm</span>
        <span>15+ mm</span>
      </div>
      <p class="mt-2 text-xs leading-5 text-slate-400">
        Soft blue veils show light rain; purple and red cores mark heavier cells.
      </p>
    </aside>
  );
}
