import type { RouteSectionProps } from '@solidjs/router';
import { createEffect, createMemo, createResource, createSignal, onCleanup } from 'solid-js';
import { fetchRainForecast } from './api.ts';
import { getInitialForecastTimeIndex, getNextForecastTimeIndex } from './forecast.ts';

import { ForecastLegend } from './components/ForecastLegend.tsx';
import { ForecastTimelineControls } from './components/ForecastTimelineControls.tsx';
import { GermanyMap } from './components/GermanyMap.tsx';
import { MapIntroPanel } from './components/MapIntroPanel.tsx';

const PLAYBACK_INTERVAL_MS = 700;

export default function App(_props: RouteSectionProps) {
  const [forecast] = createResource(fetchRainForecast);
  const [selectedTimeIndex, setSelectedTimeIndex] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  let selectedInitialTime = false;
  const selectedForecast = createMemo(() => forecast());
  const selectedIndex = createMemo(() => {
    const times = selectedForecast()?.times ?? [];
    return Math.min(selectedTimeIndex(), Math.max(times.length - 1, 0));
  });

  createEffect(() => {
    const data = selectedForecast();

    if (!data || selectedInitialTime) return;

    setSelectedTimeIndex(getInitialForecastTimeIndex(data.times));
    selectedInitialTime = true;
  });

  createEffect(() => {
    const times = selectedForecast()?.times ?? [];

    if (!isPlaying()) return;

    if (times.length < 2) {
      setIsPlaying(false);
      return;
    }

    const timer = setInterval(() => {
      setSelectedTimeIndex((index) => getNextForecastTimeIndex(times, index));
    }, PLAYBACK_INTERVAL_MS);

    onCleanup(() => clearInterval(timer));
  });

  return (
    <main class="relative h-screen overflow-hidden bg-[#f4f6f8] text-[#111827]">
      <GermanyMap forecast={selectedForecast()} selectedTimeIndex={selectedIndex()} />
      <header class="absolute inset-x-0 top-0 z-20 shadow-[0_14px_34px_rgba(4,29,66,0.18)]">
        <div class="h-1.5 bg-[#e30613]" />
        <div class="border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="rounded-sm bg-[#e30613] px-2.5 py-1 text-xs font-black tracking-[0.18em] text-white uppercase">
                Live
              </span>
              <div>
                <p class="text-[0.68rem] font-black tracking-[0.28em] text-[#072f6b] uppercase">
                  Wetter aktuell
                </p>
                <h1 class="display-font text-3xl leading-none font-black tracking-tight text-[#041d42] sm:text-4xl">
                  Regenradar
                </h1>
              </div>
            </div>
            <p class="hidden max-w-md text-right text-sm leading-5 font-semibold text-slate-600 md:block">
              Deutschlandweite Niederschlagsprognose auf Basis aktualisierter Modelldaten.
            </p>
          </div>
        </div>
        <nav class="bg-[#072f6b] px-4 py-2 text-xs font-bold tracking-[0.18em] text-white uppercase sm:px-6">
          <div class="mx-auto flex max-w-7xl gap-4 overflow-hidden whitespace-nowrap">
            <span>Deutschland</span>
            <span class="text-white/45">|</span>
            <span>Niederschlag</span>
            <span class="text-white/45">|</span>
            <span>Stundenprognose</span>
          </div>
        </nav>
      </header>
      <MapIntroPanel
        error={forecast.error}
        forecast={selectedForecast()}
        loading={forecast.loading}
      />
      <ForecastLegend />
      <ForecastTimelineControls
        isPlaying={isPlaying()}
        selectedTimeIndex={selectedIndex()}
        times={selectedForecast()?.times ?? []}
        onTogglePlayback={() => setIsPlaying((playing) => !playing)}
        onSelectTime={setSelectedTimeIndex}
      />
    </main>
  );
}
