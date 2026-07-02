import { useRef, useState } from 'react';
import type { TestModule, TestStatus } from '../types';
import { useAppState } from '../context/AppState';

const RESULT_LABEL: Record<TestStatus, string> = {
  'not-run': '',
  pass: 'PASS ✅',
  fail: 'FAIL ❌',
  skip: 'SKIPPED ⏭️',
  na: 'N/A',
};

export function TestPanel({
  test,
  onClose,
  onReported,
}: {
  test: TestModule;
  onClose: () => void;
  onReported?: (status: TestStatus) => void;
}) {
  const { device, results, setResult } = useAppState();
  const os = device?.os ?? 'other';
  const result = results[test.id] ?? { status: 'not-run' as TestStatus };
  const Comp = test.Component;
  const [flash, setFlash] = useState<TestStatus | null>(null);
  const closingRef = useRef(false);

  const report = (status: TestStatus, details?: string) => {
    setResult(test.id, status, details);
    if (onReported) {
      // Run-All mode: advance immediately to the next test.
      onReported(status);
      return;
    }
    // Single mode: briefly show the recorded result, then return to dashboard.
    if (closingRef.current) return;
    closingRef.current = true;
    setFlash(status);
    window.setTimeout(onClose, 650);
  };

  return (
    <div className="panel-overlay" role="dialog" aria-modal="true">
      <div className="panel">
        <div className="panel-head">
          <button className="panel-back" onClick={onClose} aria-label="Bumalik">
            ←
          </button>
          <div className="panel-title">
            <span className="panel-cat">{test.category}</span>
            <h2>{test.title}</h2>
          </div>
        </div>
        <div className="panel-scroll">
          <Comp report={report} result={result} onClose={onClose} os={os} />
        </div>
      </div>
      {flash && (
        <div className={`result-flash flash-${flash}`}>
          <span>{RESULT_LABEL[flash]}</span>
          <small>Na-record — balik sa dashboard…</small>
        </div>
      )}
    </div>
  );
}
