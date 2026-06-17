export function ForecastLegend() {
  return (
    <aside class="pointer-events-none absolute top-32 right-4 z-10 w-52 border-t-[6px] border-[#e30613] bg-white/94 p-4 shadow-[0_18px_45px_rgba(4,29,66,0.2)] ring-1 ring-slate-900/10 backdrop-blur-md sm:right-6">
      <h2 class="text-sm font-black tracking-[0.08em] text-[#041d42] uppercase">Niederschlag</h2>
      <div
        class="mt-3 h-5 shadow-inner shadow-sky-950/30 blur-[0.2px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(186, 230, 253, 0.28), rgba(125, 211, 252, 0.55), rgba(37, 99, 235, 0.66), rgba(124, 58, 237, 0.72), rgba(225, 29, 72, 0.82))',
        }}
      />
      <div class="mt-2 flex justify-between text-xs font-bold text-slate-600">
        <span>leicht</span>
        <span>15+ mm</span>
      </div>
      <p class="mt-2 text-xs leading-5 font-medium text-slate-600">
        Blau zeigt leichten Regen; Violett und Rot markieren stärkere Zellen.
      </p>
    </aside>
  );
}
