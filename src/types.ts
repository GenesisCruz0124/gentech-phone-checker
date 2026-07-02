import type { ComponentType } from 'react';

export type OS = 'android' | 'ios' | 'other';

export type SupportedOn = 'all' | 'android' | 'ios';

export type TestStatus = 'not-run' | 'pass' | 'fail' | 'skip' | 'na';

export interface TestResult {
  status: TestStatus;
  details?: string;
  /** epoch ms of when the result was recorded */
  at?: number;
}

/** Props every test component receives. */
export interface TestProps {
  /** Record the outcome for this test. */
  report: (status: TestStatus, details?: string) => void;
  /** Current stored result (for resuming / display). */
  result: TestResult;
  /** Close the test panel and return to the dashboard. */
  onClose: () => void;
  os: OS;
}

export type TestCategory =
  | 'Screen / LCD'
  | 'Touchscreen'
  | 'Audio'
  | 'Cameras'
  | 'Sensors & Buttons'
  | 'Connectivity & Power';

/** Static definition of a test in the registry. */
export interface TestModule {
  id: string;
  title: string;
  category: TestCategory;
  supportedOn: SupportedOn;
  /** One-line Taglish blurb shown on the dashboard card. */
  blurb: string;
  Component: ComponentType<TestProps>;
}

export interface DeviceInfo {
  os: OS;
  osVersion: string;
  browser: string;
  brandModelGuess: string;
  screenW: number;
  screenH: number;
  pixelRatio: number;
  gpuRenderer: string;
  deviceMemoryGB: number | null;
  cpuCores: number | null;
  refreshRateHz: number | null;
  /** true when the user manually overrode OS detection */
  osOverridden: boolean;
}
