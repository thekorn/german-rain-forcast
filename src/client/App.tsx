import type { RouteSectionProps } from '@solidjs/router';
import { createMemo, createResource, createSignal } from 'solid-js';
import { fetchRainForecast } from './api.ts';

import { ForecastLegend } from './components/ForecastLegend.tsx';
import { ForecastTimelineControls } from './components/ForecastTimelineControls.tsx';
import { GermanyMap } from './components/GermanyMap.tsx';
import { MapIntroPanel } from './components/MapIntroPanel.tsx';

export default function App(_props: RouteSectionProps) {
  const [forecast] = createResource(fetchRainForecast);
  const [selectedTimeIndex, setSelectedTimeIndex] = createSignal(0);
  const selectedForecast = createMemo(() => forecast());
  const selectedIndex = createMemo(() => {
    const times = selectedForecast()?.times ?? [];
    return Math.min(selectedTimeIndex(), Math.max(times.length - 1, 0));
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
        selectedTimeIndex={selectedIndex()}
        times={selectedForecast()?.times ?? []}
        onSelectTime={setSelectedTimeIndex}
      />
    </main>
  );
}
