import { useMemo, useState } from 'react';
import { useAppState } from '../context/AppState';
import { TESTS, CATEGORIES } from '../tests/registry';
import { TestPanel } from './TestPanel';
import type { TestModule, TestStatus } from '../types';

function statusIcon(status: TestStatus, na: boolean): string {
  if (na) return '🚫';
  switch (status) {
    case 'pass': return '✅';
    case 'fail': return '❌';
    case 'skip': return '⏭️';
    default: return '⚪';
  }
}

function isNA(test: TestModule, os: string): boolean {
  if (test.supportedOn === 'all') return false;
  return test.supportedOn !== os;
}

function naReason(test: TestModule): string {
  if (test.supportedOn === 'android') return 'Android Chrome lang — restriction ng iOS/browser.';
  if (test.supportedOn === 'ios') return 'iOS lang.';
  return 'Hindi available dito.';
}

export function Dashboard({ onReport }: { onReport: () => void }) {
  const { device, results } = useAppState();
  const os = device?.os ?? 'other';
  const [activeId, setActiveId] = useState<string | null>(null);
  const [runAllQueue, setRunAllQueue] = useState<string[] | null>(null);

  const runnable = useMemo(() => TESTS.filter((t) => !isNA(t, os)), [os]);

  const counts = useMemo(() => {
    let pass = 0, fail = 0, skip = 0, done = 0;
    for (const t of TESTS) {
      const r = results[t.id];
      if (!r) continue;
      if (r.status === 'pass') { pass++; done++; }
      else if (r.status === 'fail') { fail++; done++; }
      else if (r.status === 'skip') { skip++; done++; }
    }
    return { pass, fail, skip, done, total: runnable.length };
  }, [results, runnable]);

  const active = activeId ? TESTS.find((t) => t.id === activeId) ?? null : null;

  const startRunAll = () => {
    const queue = runnable.map((t) => t.id);
    setRunAllQueue(queue);
    setActiveId(queue[0] ?? null);
  };

  const handleReported = () => {
    if (!runAllQueue) return;
    const idx = runAllQueue.indexOf(activeId ?? '');
    const next = runAllQueue[idx + 1];
    if (next) {
      setActiveId(next);
    } else {
      setRunAllQueue(null);
      setActiveId(null);
    }
  };

  const closePanel = () => {
    setActiveId(null);
    setRunAllQueue(null);
  };

  return (
    <div className="screen">
      <div className="dash-head">
        <h1 className="screen-title">Tests</h1>
        <div className="dash-progress">
          {counts.done}/{counts.total} done · <span className="ok">{counts.pass}✅</span>{' '}
          <span className="bad">{counts.fail}❌</span> <span>{counts.skip}⏭️</span>
        </div>
      </div>

      <div className="dash-actions">
        <button className="btn btn-primary" onClick={startRunAll}>
          ▶ Run All (guided)
        </button>
        <button className="btn btn-ghost" onClick={onReport}>
          📋 Report
        </button>
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat} className="cat-section">
          <h2 className="cat-title">{cat}</h2>
          <div className="card-grid">
            {TESTS.filter((t) => t.category === cat).map((t) => {
              const na = isNA(t, os);
              const r = results[t.id];
              const status = r?.status ?? 'not-run';
              return (
                <button
                  key={t.id}
                  className={`test-card ${na ? 'test-card-na' : ''} status-${na ? 'na' : status}`}
                  onClick={() => !na && setActiveId(t.id)}
                  disabled={na}
                >
                  <span className="test-card-icon">{statusIcon(status, na)}</span>
                  <span className="test-card-title">{t.title}</span>
                  <span className="test-card-blurb">{na ? naReason(t) : t.blurb}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <button className="btn btn-primary btn-lg" onClick={onReport}>
        Tignan ang Report →
      </button>

      {active && (
        <TestPanel
          test={active}
          onClose={closePanel}
          onReported={runAllQueue ? handleReported : undefined}
        />
      )}
    </div>
  );
}
