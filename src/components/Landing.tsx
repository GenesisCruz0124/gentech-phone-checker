import { useState } from 'react';
import { APP_NAME, BRAND } from '../version';
import { QrCode } from './QrCode';
import { appUrl } from '../utils/qr';

export function Landing({ onStart }: { onStart: () => void }) {
  const [showQr, setShowQr] = useState(true);
  return (
    <div className="screen landing">
      <div className="brand-block">
        <img src="/icon.svg" className="brand-logo" alt="GenTech logo" width={88} height={88} />
        <h2 className="brand-name">{BRAND}</h2>
        <h1 className="app-title">{APP_NAME}</h1>
        <p className="tagline">
          I-check ang phone mo diretso sa browser — screen, touch, audio, camera, sensors,
          at iba pa. Walang app na ida-download, walang data na aalis sa device mo.
        </p>
      </div>

      <button className="btn btn-primary btn-lg" onClick={onStart}>
        Start Diagnostic 🚀
      </button>

      <button className="btn btn-ghost" onClick={() => setShowQr((v) => !v)}>
        {showQr ? 'Itago ang QR' : '📱 Share / QR code'}
      </button>

      {showQr && (
        <div className="qr-block">
          <QrCode url={appUrl()} size={180} />
          <p className="qr-caption">I-scan para buksan / i-share ang GenTech Checker</p>
        </div>
      )}

      <p className="disclaimer">
        Browser-based diagnostic — may limitations vs native service tools. Para sa full
        board-level diagnosis, bisitahin ang {BRAND}.
      </p>
    </div>
  );
}
