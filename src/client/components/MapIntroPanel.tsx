export function MapIntroPanel() {
  return (
    <section class="pointer-events-none absolute top-4 left-4 max-w-sm rounded-2xl bg-slate-950/80 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <p class="text-xs font-semibold tracking-[0.25em] text-sky-200 uppercase">
        German Rain Forecast
      </p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight">DWD ICON precipitation map</h1>
      <p class="mt-2 text-sm leading-6 text-slate-200">
        Forecast overlays will appear here once precipitation data is connected.
      </p>
    </section>
  );
}
