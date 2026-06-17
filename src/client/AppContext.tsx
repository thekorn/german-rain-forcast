import { createContext, useContext, type Accessor } from 'solid-js';

interface AppContextValue {
  error: Accessor<string | null>;
  connected: Accessor<boolean>;
}

const AppContext = createContext<AppContextValue>();

export function useAppConnection() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppConnection must be used within AppProvider');
  return ctx;
}

export { AppContext };
export type { AppContextValue };
