import type { RouteSectionProps } from '@solidjs/router';
import { createEffect, createMemo, createResource, createSignal, onCleanup } from 'solid-js';
import { fetchRainForecast } from './api.ts';
import { getInitialForecastTimeIndex, getNextForecastTimeIndex } from './forecast.ts';

import { ForecastLegend } from './components/ForecastLegend.tsx';
import { ForecastTimelineControls } from './components/ForecastTimelineControls.tsx';
import { GermanyMap } from './components/GermanyMap.tsx';
import { MapIntroPanel } from './components/MapIntroPanel.tsx';

const PLAYBACK_INTERVAL_MS = 400;

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
    <main class="relative h-screen overflow-hidden bg-slate-950 text-white">
      <GermanyMap forecast={selectedForecast()} selectedTimeIndex={selectedIndex()} />
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
