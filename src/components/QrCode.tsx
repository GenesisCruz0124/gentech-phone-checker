import { useEffect, useRef } from 'react';
import { makeQr } from '../utils/qr';

/** Renders a QR code for `url` onto a crisp canvas (dark modules on white). */
export function QrCode({ url, size = 168 }: { url: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const m = makeQr(url);
    const margin = 3;
    const total = m.count + margin * 2;
    const dpr = window.devicePixelRatio || 1;
    const cell = Math.max(2, Math.floor((size * dpr) / total));
    const dim = cell * total;
    canvas.width = dim;
    canvas.height = dim;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = '#0b0f14';
    for (let r = 0; r < m.count; r++) {
      for (let c = 0; c < m.count; c++) {
        if (m.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
      }
    }
  }, [url, size]);
  return <canvas ref={ref} className="qr-canvas" aria-label="QR code sa app" />;
}
