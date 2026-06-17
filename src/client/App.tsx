import type { RouteSectionProps } from '@solidjs/router';
import { createConnection } from './api.ts';

import { AppContext } from './AppContext.tsx';

export default function App(_props: RouteSectionProps) {
  const connection = createConnection();

  const contextValue = {
    ...connection,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div class="flex h-screen bg-gray-50">Hello world</div>
    </AppContext.Provider>
  );
}
