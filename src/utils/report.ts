import type { DeviceInfo, TestModule, TestResult, TestStatus } from '../types';
import { APP_NAME, APP_VERSION, BRAND, MESSENGER } from '../version';

export interface ReportRow {
  title: string;
  category: string;
  status: TestStatus;
  na: boolean;
  details?: string;
}

export interface ReportData {
  rows: ReportRow[];
  pass: number;
  fail: number;
  skip: number;
  notRun: number;
  na: number;
  when: string;
}

function statusLabel(status: TestStatus, na: boolean): string {
  if (na) return 'N/A';
  switch (status) {
    case 'pass': return 'PASS';
    case 'fail': return 'FAIL';
    case 'skip': return 'SKIP';
    default: return '—';
  }
}

export function buildReportData(
  tests: TestModule[],
  results: Record<string, TestResult>,
  os: string,
): ReportData {
  let pass = 0, fail = 0, skip = 0, notRun = 0, na = 0;
  const rows: ReportRow[] = tests.map((t) => {
    const isNa = t.supportedOn !== 'all' && t.supportedOn !== os;
    const r = results[t.id];
    const status = r?.status ?? 'not-run';
    if (isNa) na++;
    else if (status === 'pass') pass++;
    else if (status === 'fail') fail++;
    else if (status === 'skip') skip++;
    else notRun++;
    return { title: t.title, category: t.category, status, na: isNa, details: r?.details };
  });
  return {
    rows,
    pass,
    fail,
    skip,
    notRun,
    na,
    when: new Date().toLocaleString(),
  };
}

export function buildReportText(data: ReportData, device: DeviceInfo | null, imei: string): string {
  const lines: string[] = [];
  lines.push(`${BRAND} — ${APP_NAME} v${APP_VERSION}`);
  lines.push(`Date: ${data.when}`);
  lines.push('');
  lines.push('== DEVICE ==');
  if (device) {
    lines.push(`Model (best guess): ${device.brandModelGuess}`);
    lines.push(`OS: ${device.os.toUpperCase()} ${device.osVersion}`);
    lines.push(`Browser: ${device.browser}`);
    lines.push(`Screen: ${device.screenW}x${device.screenH} @ ${device.pixelRatio}x`);
    if (device.refreshRateHz) lines.push(`Refresh: ${device.refreshRateHz} Hz`);
  }
  if (imei.trim()) lines.push(`IMEI: ${imei.trim()}`);
  lines.push('');
  lines.push('== RESULTS ==');
  lines.push(`✅ ${data.pass} passed · ❌ ${data.fail} failed · ⏭️ ${data.skip} skipped`);
  lines.push('');
  let cat = '';
  for (const r of data.rows) {
    if (r.category !== cat) {
      cat = r.category;
      lines.push(`— ${cat} —`);
    }
    lines.push(`${statusLabel(r.status, r.na)}  ${r.title}${r.details ? ` (${r.details})` : ''}`);
  }
  lines.push('');
  lines.push(`May sira ba? Message us: ${MESSENGER}`);
  lines.push('Browser-based diagnostic — may limitations vs native tools.');
  return lines.join('\n');
}

/** Draw the report onto a canvas and return a PNG blob (no external deps). */
export function drawReportCanvas(
  data: ReportData,
  device: DeviceInfo | null,
  imei: string,
): HTMLCanvasElement {
  const W = 720;
  const pad = 32;
  const line = 26;
  const dpr = 2;

  // First measure how many lines we need.
  const body: { text: string; kind: 'h1' | 'h2' | 'meta' | 'row' | 'pass' | 'fail' | 'skip' | 'na' }[] = [];
  body.push({ text: `${BRAND}`, kind: 'h1' });
  body.push({ text: `${APP_NAME} v${APP_VERSION}`, kind: 'meta' });
  body.push({ text: data.when, kind: 'meta' });
  body.push({ text: 'DEVICE', kind: 'h2' });
  if (device) {
    body.push({ text: `Model: ${device.brandModelGuess}`, kind: 'row' });
    body.push({ text: `OS: ${device.os.toUpperCase()} ${device.osVersion} · ${device.browser}`, kind: 'row' });
    body.push({ text: `Screen: ${device.screenW}x${device.screenH} @${device.pixelRatio}x · ${device.refreshRateHz ?? '?'}Hz`, kind: 'row' });
  }
  if (imei.trim()) body.push({ text: `IMEI: ${imei.trim()}`, kind: 'row' });
  body.push({ text: `RESULTS — ${data.pass} pass / ${data.fail} fail / ${data.skip} skip`, kind: 'h2' });
  let cat = '';
  for (const r of data.rows) {
    if (r.category !== cat) {
      cat = r.category;
      body.push({ text: cat, kind: 'h2' });
    }
    const mark = r.na ? '🚫' : r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : r.status === 'skip' ? '⏭️' : '⚪';
    const kind = r.na ? 'na' : r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'fail' : r.status === 'skip' ? 'skip' : 'row';
    body.push({ text: `${mark} ${r.title}${r.details ? ` — ${r.details}` : ''}`, kind });
  }
  body.push({ text: `May sira ba? Message us: ${MESSENGER}`, kind: 'h2' });

  const H = pad * 2 + body.length * line + 40;
  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // background
  ctx.fillStyle = '#0b0f14';
  ctx.fillRect(0, 0, W, H);
  // accent bar
  ctx.fillStyle = '#12d6a0';
  ctx.fillRect(0, 0, W, 6);

  let y = pad + 10;
  for (const b of body) {
    if (b.kind === 'h1') {
      ctx.fillStyle = '#12d6a0';
      ctx.font = 'bold 26px system-ui, sans-serif';
    } else if (b.kind === 'h2') {
      y += 8;
      ctx.fillStyle = '#8fa3b0';
      ctx.font = 'bold 15px system-ui, sans-serif';
    } else if (b.kind === 'meta') {
      ctx.fillStyle = '#8fa3b0';
      ctx.font = '13px system-ui, sans-serif';
    } else {
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle =
        b.kind === 'pass' ? '#12d6a0' :
        b.kind === 'fail' ? '#ff5c5c' :
        b.kind === 'skip' ? '#e0b34d' :
        b.kind === 'na' ? '#6b7a86' : '#e6edf3';
    }
    ctx.fillText(b.text, pad, y);
    y += line;
  }
  return canvas;
}
