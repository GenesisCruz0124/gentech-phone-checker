import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { TestStatus } from '../types';

/** Standard Pass / Fail (+ optional Skip) buttons for manual/guided tests. */
export function ResultButtons({
  onResult,
  showSkip = true,
  passLabel = 'Pass ✅',
  failLabel = 'Fail ❌',
}: {
  onResult: (status: TestStatus, details?: string) => void;
  showSkip?: boolean;
  passLabel?: string;
  failLabel?: string;
}) {
  return (
    <div className="result-buttons">
      <button className="btn btn-pass" onClick={() => onResult('pass')}>
        {passLabel}
      </button>
      <button className="btn btn-fail" onClick={() => onResult('fail')}>
        {failLabel}
      </button>
      {showSkip && (
        <button className="btn btn-ghost" onClick={() => onResult('skip')}>
          Skip ⏭️
        </button>
      )}
    </div>
  );
}

/** Friendly permission-denied / error block with retry. */
export function PermissionError({
  message,
  onRetry,
  hint,
}: {
  message: string;
  onRetry?: () => void;
  hint?: string;
}) {
  return (
    <div className="perm-error">
      <div className="perm-error-icon">🔒</div>
      <p className="perm-error-msg">{message}</p>
      {hint && <p className="perm-error-hint">{hint}</p>}
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Subukan ulit
        </button>
      )}
    </div>
  );
}

/**
 * Fullscreen overlay. Uses the Fullscreen API where available; on iOS Safari
 * (no element fullscreen) falls back to a fixed full-viewport overlay that
 * hides as much chrome as possible.
 */
export function Fullscreen({
  active,
  onExit,
  children,
}: {
  active: boolean;
  onExit: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    const canNative =
      el && typeof el.requestFullscreen === 'function' && document.fullscreenEnabled;
    if (canNative) {
      el.requestFullscreen().catch(() => {
        /* fall back to fixed overlay (already applied via CSS) */
      });
    }
    const onFsChange = () => {
      if (!document.fullscreenElement) onExit();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;
  return (
    <div className="fullscreen-overlay" ref={ref}>
      {children}
    </div>
  );
}

/** Small hook returning a MediaStream + lifecycle for camera/mic tests. */
export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const start = useCallback(
    async (constraints: MediaStreamConstraints) => {
      setError(null);
      setLoading(true);
      stop();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('unsupported');
        }
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = s;
        setStream(s);
        return s;
      } catch (err) {
        const name = (err as { name?: string }).name ?? '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('Na-block ang permission. Pindutin ulit at i-allow para tumakbo ang test.');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setError('Walang na-detect na device para dito.');
        } else if ((err as Error).message === 'unsupported') {
          setError('Hindi suportado ng browser mo ang feature na ito.');
        } else {
          setError('May error sa pag-access. Subukan ulit.');
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { stream, error, loading, start, stop };
}
