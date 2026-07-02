import { useEffect, useState } from 'react';
import { useAppState } from '../context/AppState';
import { detectDevice } from '../device/detect';
import { checkImei } from '../utils/luhn';
import type { OS } from '../types';

export function DeviceDetection({ onContinue }: { onContinue: () => void }) {
  const { device, setDevice, overrideOS, imei, setImei } = useAppState();
  const [loading, setLoading] = useState(!device);

  useEffect(() => {
    if (device) return;
    let mounted = true;
    detectDevice().then((d) => {
      if (mounted) {
        setDevice(d);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const imeiCheck = imei ? checkImei(imei) : null;

  if (loading || !device) {
    return (
      <div className="screen">
        <div className="loader">Chine-check ang device mo…</div>
      </div>
    );
  }

  const osChips: { key: OS; label: string }[] = [
    { key: 'android', label: 'Android' },
    { key: 'ios', label: 'iOS' },
  ];

  return (
    <div className="screen">
      <h1 className="screen-title">Device Info</h1>

      <div className="card">
        <div className="card-head">
          <span className="badge">Detected (best guess)</span>
        </div>
        <div className="model-guess">{device.brandModelGuess}</div>

        <ul className="info-list">
          <li><span>OS</span><strong>{device.os.toUpperCase()} {device.osVersion}</strong></li>
          <li><span>Browser</span><strong>{device.browser}</strong></li>
          <li><span>Screen</span><strong>{device.screenW}×{device.screenH} @ {device.pixelRatio}x</strong></li>
          <li><span>Refresh rate</span><strong>{device.refreshRateHz ? `${device.refreshRateHz} Hz` : 'N/A'}</strong></li>
          <li><span>GPU</span><strong className="gpu">{device.gpuRenderer}</strong></li>
          <li><span>CPU cores</span><strong>{device.cpuCores ?? 'N/A'}</strong></li>
          <li><span>RAM (approx)</span><strong>{device.deviceMemoryGB ? `~${device.deviceMemoryGB} GB` : 'N/A'}</strong></li>
        </ul>

        <div className="override-row">
          <span className="override-label">OS override:</span>
          {osChips.map((c) => (
            <button
              key={c.key}
              className={`chip ${device.os === c.key ? 'chip-active' : ''}`}
              onClick={() => overrideOS(c.key)}
            >
              {c.label}
            </button>
          ))}
          {device.osOverridden && <span className="override-note">(manual)</span>}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>IMEI</h3>
        </div>
        <p className="test-desc">
          Hindi kayang basahin ng browser ang IMEI. I-dial ang <strong>*#06#</strong> sa
          phone mo, tapos i-type/paste dito para lumabas sa report.
        </p>
        <input
          className="text-input"
          inputMode="numeric"
          placeholder="15-digit IMEI"
          value={imei}
          onChange={(e) => setImei(e.target.value)}
          maxLength={20}
        />
        {imeiCheck && (
          <div className={`imei-status ${imeiCheck.valid ? 'ok' : 'bad'}`}>
            {imeiCheck.valid
              ? '✅ Valid IMEI (Luhn check passed)'
              : imeiCheck.lengthOk
                ? '❌ Mali ang Luhn checksum'
                : `⚠️ ${imeiCheck.digits.length}/15 digits`}
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-lg" onClick={onContinue}>
        Sa mga test →
      </button>
    </div>
  );
}
