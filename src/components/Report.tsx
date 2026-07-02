import { useMemo, useState } from 'react';
import { useAppState } from '../context/AppState';
import { TESTS } from '../tests/registry';
import { buildReportData, buildReportText, drawReportCanvas } from '../utils/report';
import { APP_NAME, APP_VERSION, BRAND, MESSENGER } from '../version';
import type { TestStatus } from '../types';

function badge(status: TestStatus, na: boolean) {
  if (na) return <span className="rstat rstat-na">N/A</span>;
  switch (status) {
    case 'pass': return <span className="rstat rstat-pass">PASS</span>;
    case 'fail': return <span className="rstat rstat-fail">FAIL</span>;
    case 'skip': return <span className="rstat rstat-skip">SKIP</span>;
    default: return <span className="rstat rstat-none">—</span>;
  }
}

export function Report({ onBack, onReset }: { onBack: () => void; onReset: () => void }) {
  const { device, imei, results } = useAppState();
  const os = device?.os ?? 'other';
  const data = useMemo(() => buildReportData(TESTS, results, os), [results, os]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const copyText = async () => {
    const text = buildReportText(data, device, imei);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select via a temporary textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
  };

  const saveImage = async () => {
    setBusy(true);
    try {
      const canvas = drawReportCanvas(data, device, imei);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('no blob');
      const fileName = `GenTech-Report-${new Date().toISOString().slice(0, 10)}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      const navShare = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (navShare.canShare && navShare.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${APP_NAME} Report` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* user cancelled share or error — non-fatal */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen report">
      <div className="report-header">
        <div>
          <div className="report-brand">{BRAND}</div>
          <div className="report-app">{APP_NAME} <span className="v">v{APP_VERSION}</span></div>
        </div>
        <div className="report-date">{data.when}</div>
      </div>

      <div className="verdict">
        <span className="ok">{data.pass} passed</span> ·{' '}
        <span className="bad">{data.fail} failed</span> ·{' '}
        <span>{data.skip} skipped</span>
      </div>

      <div className="card">
        <h3>Device</h3>
        <ul className="info-list">
          <li><span>Model (best guess)</span><strong>{device?.brandModelGuess ?? '—'}</strong></li>
          <li><span>OS</span><strong>{device ? `${device.os.toUpperCase()} ${device.osVersion}` : '—'}</strong></li>
          <li><span>Screen</span><strong>{device ? `${device.screenW}×${device.screenH} @${device.pixelRatio}x` : '—'}</strong></li>
          <li><span>Refresh</span><strong>{device?.refreshRateHz ? `${device.refreshRateHz} Hz` : 'N/A'}</strong></li>
          {imei.trim() && <li><span>IMEI</span><strong>{imei.trim()}</strong></li>}
        </ul>
      </div>

      <div className="card">
        <h3>Results</h3>
        <ul className="report-list">
          {data.rows.map((r) => (
            <li key={r.title}>
              <span className="rtitle">{r.title}</span>
              {r.details && <span className="rdetails">{r.details}</span>}
              {badge(r.status, r.na)}
            </li>
          ))}
        </ul>
      </div>

      <div className="export-actions">
        <button className="btn btn-primary" onClick={saveImage} disabled={busy}>
          {busy ? '…' : '🖼️ Save as image'}
        </button>
        <button className="btn btn-primary" onClick={copyText}>
          {copied ? '✅ Copied!' : '📋 Copy for Messenger'}
        </button>
      </div>

      <div className="report-cta">
        May sira ba? Message us:{' '}
        <a href={`https://${MESSENGER}`} target="_blank" rel="noopener noreferrer">
          {MESSENGER}
        </a>
      </div>

      <p className="disclaimer">
        Browser-based diagnostic — may limitations vs native service tools. Para sa full
        board-level diagnosis, bisitahin ang {BRAND}.
      </p>

      <div className="report-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Balik sa tests</button>
        <button className="btn btn-fail" onClick={onReset}>New Test</button>
      </div>
    </div>
  );
}
