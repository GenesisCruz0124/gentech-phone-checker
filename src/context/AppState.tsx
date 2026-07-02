import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DeviceInfo, OS, TestResult, TestStatus } from '../types';

const STORAGE_KEY = 'gentech-checker-session-v1';

interface PersistedState {
  device: DeviceInfo | null;
  imei: string;
  results: Record<string, TestResult>;
  startedAt: number | null;
}

interface AppState extends PersistedState {
  setDevice: (d: DeviceInfo) => void;
  overrideOS: (os: OS) => void;
  setImei: (v: string) => void;
  setResult: (id: string, status: TestStatus, details?: string) => void;
  resetSession: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

function load(): PersistedState {
  const empty: PersistedState = { device: null, imei: '', results: {}, startedAt: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      device: parsed.device ?? null,
      imei: parsed.imei ?? '',
      results: parsed.results ?? {},
      startedAt: parsed.startedAt ?? null,
    };
  } catch {
    return empty;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => load());
  const saveTimer = useRef<number | null>(null);

  // Debounced persistence so we don't thrash localStorage during tests.
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage full or blocked — non-fatal */
      }
    }, 250);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  const setDevice = useCallback((d: DeviceInfo) => {
    setState((s) => ({
      ...s,
      device: d,
      startedAt: s.startedAt ?? Date.now(),
    }));
  }, []);

  const overrideOS = useCallback((os: OS) => {
    setState((s) => (s.device ? { ...s, device: { ...s.device, os, osOverridden: true } } : s));
  }, []);

  const setImei = useCallback((v: string) => {
    setState((s) => ({ ...s, imei: v }));
  }, []);

  const setResult = useCallback((id: string, status: TestStatus, details?: string) => {
    setState((s) => ({
      ...s,
      results: { ...s.results, [id]: { status, details, at: Date.now() } },
    }));
  }, []);

  const resetSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState({ device: null, imei: '', results: {}, startedAt: null });
  }, []);

  const value = useMemo<AppState>(
    () => ({ ...state, setDevice, overrideOS, setImei, setResult, resetSession }),
    [state, setDevice, overrideOS, setImei, setResult, resetSession],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
