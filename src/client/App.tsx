import type { RouteSectionProps } from '@solidjs/router';
import { createConnection } from './api.ts';

import { AppContext } from './AppContext.tsx';
import { ForecastLegend } from './components/ForecastLegend.tsx';
import { ForecastTimelineControls } from './components/ForecastTimelineControls.tsx';
import { GermanyMap } from './components/GermanyMap.tsx';
import { MapIntroPanel } from './components/MapIntroPanel.tsx';

export default function App(_props: RouteSectionProps) {
  const connection = createConnection();

  const contextValue = {
    ...connection,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <main class="relative h-screen overflow-hidden bg-slate-950 text-white">
        <GermanyMap />
        <MapIntroPanel />
        <ForecastLegend />
        <ForecastTimelineControls />
      </main>
    </AppContext.Provider>
  );
}
