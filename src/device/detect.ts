import type { DeviceInfo, OS } from '../types';
import { guessIPhone, appleChipFromRenderer } from './iphoneTable';

// --- UA Client Hints (not in default TS DOM lib) ---
interface UADataValues {
  brands?: { brand: string; version: string }[];
  platform?: string;
  platformVersion?: string;
  model?: string;
  fullVersionList?: { brand: string; version: string }[];
}
interface NavigatorUAData {
  brands: { brand: string; version: string }[];
  mobile: boolean;
  platform: string;
  getHighEntropyValues?: (hints: string[]) => Promise<UADataValues>;
}
interface ExtendedNavigator extends Navigator {
  userAgentData?: NavigatorUAData;
  deviceMemory?: number;
}

export function detectOS(ua: string, nav: ExtendedNavigator): OS {
  const platform = nav.userAgentData?.platform?.toLowerCase() ?? '';
  if (/android/i.test(ua) || platform === 'android') return 'android';
  // iPadOS 13+ reports as Mac; detect touch Macs as iOS-family.
  const iOSLike =
    /iphone|ipad|ipod/i.test(ua) ||
    (platform === 'ios') ||
    (/mac/i.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
  if (iOSLike) return 'ios';
  return 'other';
}

export function detectBrowser(ua: string): string {
  if (/EdgA?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/FxiOS|Firefox/.test(ua)) return 'Firefox';
  if (/CriOS/.test(ua)) return 'Chrome (iOS)';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Unknown browser';
}

export function detectOSVersion(ua: string, os: OS): string {
  if (os === 'android') {
    const m = /Android\s+([\d.]+)/i.exec(ua);
    return m ? m[1] : 'unknown';
  }
  if (os === 'ios') {
    const m = /OS\s+(\d+[_\d]*)\s+like Mac/i.exec(ua);
    return m ? m[1].replace(/_/g, '.') : 'unknown';
  }
  return 'unknown';
}

export function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'unavailable';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      if (typeof renderer === 'string' && renderer) return renderer;
    }
    const fallback = gl.getParameter(gl.RENDERER);
    return typeof fallback === 'string' && fallback ? fallback : 'unknown';
  } catch {
    return 'unavailable';
  }
}

/** Measure display refresh rate via rAF over ~1.5s. */
export function measureRefreshRate(durationMs = 1500): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      resolve(null);
      return;
    }
    const times: number[] = [];
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      times.push(t);
      if (t - start < durationMs) {
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
        if (times.length < 3) {
          resolve(null);
          return;
        }
        const deltas: number[] = [];
        for (let i = 1; i < times.length; i++) deltas.push(times[i] - times[i - 1]);
        deltas.sort((a, b) => a - b);
        const median = deltas[Math.floor(deltas.length / 2)];
        if (!median || median <= 0) {
          resolve(null);
          return;
        }
        const hz = 1000 / median;
        // snap to common panel rates
        const common = [60, 90, 120, 144];
        let snapped = Math.round(hz);
        for (const c of common) {
          if (Math.abs(hz - c) <= 6) {
            snapped = c;
            break;
          }
        }
        resolve(snapped);
      }
    };
    raf = requestAnimationFrame(tick);
  });
}

function guessAndroidModel(
  ua: string,
  hints: UADataValues | null,
  renderer: string,
): string {
  if (hints?.model && hints.model.trim()) return hints.model.trim();
  // Fallback: parse the "Build/" model segment from the UA.
  const m = /;\s*([^;)]+?)\s+Build\//i.exec(ua);
  if (m && m[1] && !/wv$/i.test(m[1])) return m[1].trim();
  // Last resort: mention GPU so the report isn't empty.
  if (renderer && renderer !== 'unknown' && renderer !== 'unavailable') {
    return `Android device (GPU: ${renderer})`;
  }
  return 'Android device';
}

export async function detectDevice(): Promise<DeviceInfo> {
  const nav = navigator as ExtendedNavigator;
  const ua = nav.userAgent;
  const os = detectOS(ua, nav);
  const browser = detectBrowser(ua);
  const renderer = getWebGLRenderer();

  let hints: UADataValues | null = null;
  if (nav.userAgentData?.getHighEntropyValues) {
    try {
      hints = await nav.userAgentData.getHighEntropyValues([
        'model',
        'platformVersion',
        'fullVersionList',
      ]);
    } catch {
      hints = null;
    }
  }

  const dpr = window.devicePixelRatio || 1;
  const cssW = window.screen.width;
  const cssH = window.screen.height;

  let osVersion = detectOSVersion(ua, os);
  if (os === 'android' && hints?.platformVersion) osVersion = hints.platformVersion;

  let brandModelGuess: string;
  if (os === 'android') {
    brandModelGuess = guessAndroidModel(ua, hints, renderer);
  } else if (os === 'ios') {
    const g = guessIPhone(cssW, cssH, dpr, renderer);
    if (g) {
      brandModelGuess = `${g.models.join(' / ')} (${g.chip})`;
    } else {
      const chip = appleChipFromRenderer(renderer);
      brandModelGuess = chip ? `iPhone/iPad (${chip})` : 'Apple device';
    }
  } else {
    brandModelGuess = renderer !== 'unknown' ? renderer : 'Desktop / other';
  }

  const refreshRateHz = await measureRefreshRate();

  return {
    os,
    osVersion,
    browser,
    brandModelGuess,
    screenW: cssW,
    screenH: cssH,
    pixelRatio: dpr,
    gpuRenderer: renderer,
    deviceMemoryGB: os === 'android' && typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    cpuCores: typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null,
    refreshRateHz,
    osOverridden: false,
  };
}
