import { useEffect, useRef, useState } from 'react';
import type { TestProps } from '../types';
import { PermissionError, ResultButtons } from '../components/shared';

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  type?: string;
}
interface NavConn extends Navigator {
  connection?: NetworkInformation;
  getBattery?: () => Promise<BatteryManagerLike>;
  bluetooth?: { requestDevice: (opts: unknown) => Promise<{ name?: string }> };
}
interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export function OnlineStatusTest({ report }: TestProps) {
  const nav = navigator as NavConn;
  const [online, setOnline] = useState(navigator.onLine);
  const conn = nav.connection;

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return (
    <div className="test-body">
      <p className="test-desc">Online status at connection info (kung available).</p>
      <ul className="info-list">
        <li>
          <span>Status</span>
          <strong style={{ color: online ? '#12d6a0' : '#ff5c5c' }}>
            {online ? 'Online' : 'Offline'}
          </strong>
        </li>
        {conn?.effectiveType && (
          <li>
            <span>Effective type</span>
            <strong>{conn.effectiveType}</strong>
          </li>
        )}
        {typeof conn?.downlink === 'number' && (
          <li>
            <span>Downlink</span>
            <strong>{conn.downlink} Mbps</strong>
          </li>
        )}
        {conn?.type && (
          <li>
            <span>Type</span>
            <strong>{conn.type}</strong>
          </li>
        )}
        {!conn && (
          <li className="hint-text">
            Walang Network Information API (normal sa iOS Safari).
          </li>
        )}
      </ul>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s, online ? 'Online' : 'Offline')} passLabel="OK ✅" failLabel="May problema ❌" />
      </div>
    </div>
  );
}

export function SpeedTest({ report }: TestProps) {
  const nav = navigator as NavConn;
  const [running, setRunning] = useState(false);
  const [median, setMedian] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const [netType, setNetType] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const c = nav.connection;
    if (c?.type) setNetType(c.type);
    else if (c?.effectiveType) setNetType(c.effectiveType);
  }, [nav.connection]);

  const run = async () => {
    setRunning(true);
    setErr(null);
    setSamples([]);
    setMedian(null);
    // Public CDN asset (~small) with cache-busting; measure download throughput.
    const url = 'https://speed.cloudflare.com/__down?bytes=2000000';
    const results: number[] = [];
    try {
      for (let i = 0; i < 3; i++) {
        const t0 = performance.now();
        const res = await fetch(`${url}&cb=${Date.now()}-${i}`, { cache: 'no-store' });
        const buf = await res.arrayBuffer();
        const secs = (performance.now() - t0) / 1000;
        const mbps = (buf.byteLength * 8) / secs / 1_000_000;
        results.push(Number(mbps.toFixed(1)));
        setSamples([...results]);
      }
      const sorted = [...results].sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      setMedian(med);
      report('pass', `${med} Mbps median${netType ? ` (${netType})` : ''}`);
    } catch {
      setErr('Hindi natapos ang speed test. Check ang internet mo at subukan ulit.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        Nagda-download ng maliit na file (3 samples) para sukatin ang Mbps — median ang
        ipapakita. {netType ? `Detected: ${netType}.` : 'Piliin kung WiFi o cellular ka.'}
      </p>
      {median != null && <div className="big-readout">{median} Mbps</div>}
      {samples.length > 0 && median == null && (
        <div className="hint-text">Samples: {samples.join(', ')} Mbps…</div>
      )}
      {err && <PermissionError message={err} onRetry={run} />}
      {!running && (
        <button className="btn btn-primary" onClick={run}>
          {median != null ? 'Ulitin' : 'Simulan ang speed test'}
        </button>
      )}
      {running && <div className="hint-text">Nagte-test… {samples.length}/3</div>}
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s, median != null ? `${median} Mbps` : undefined)} passLabel="OK ✅" failLabel="Mabagal ❌" />
      </div>
    </div>
  );
}

export function BluetoothTest({ report }: TestProps) {
  const nav = navigator as NavConn;
  const [err, setErr] = useState<string | null>(null);
  const [found, setFound] = useState<string | null>(null);

  const scan = async () => {
    setErr(null);
    if (!nav.bluetooth) {
      setErr('Web Bluetooth hindi supported (normal sa iOS).');
      return;
    }
    try {
      const device = await nav.bluetooth.requestDevice({ acceptAllDevices: true });
      setFound(device.name || 'May napiling device');
      report('pass', 'Bumukas ang BT chooser at may radio');
    } catch (e) {
      const name = (e as { name?: string }).name ?? '';
      if (name === 'NotFoundError') {
        // Chooser opened but user cancelled — radio still works.
        setFound('Bumukas ang chooser (na-cancel)');
        report('pass', 'BT chooser opened (radio OK)');
      } else {
        setErr('Hindi ma-access ang Bluetooth. Subukan ulit.');
      }
    }
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        Android Chrome lang. Pindutin para mag-scan — kung bumukas ang device chooser at
        may nakita, gumagana ang BT radio.
      </p>
      <button className="btn btn-primary" onClick={scan}>
        Mag-scan ng Bluetooth
      </button>
      {found && <div className="big-readout" style={{ color: '#12d6a0', fontSize: '1.1rem' }}>{found}</div>}
      {err && <PermissionError message={err} onRetry={scan} />}
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s)} passLabel="Gumagana ✅" failLabel="Sira ❌" />
      </div>
    </div>
  );
}

export function BatteryTest({ report }: TestProps) {
  const nav = navigator as NavConn;
  const [info, setInfo] = useState<{ level: number; charging: boolean; chargingTime: number } | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [chargeDetected, setChargeDetected] = useState<'idle' | 'waiting' | 'yes' | 'timeout'>('idle');
  const batRef = useRef<BatteryManagerLike | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!nav.getBattery) {
      setSupported(false);
      return;
    }
    nav.getBattery().then((bat) => {
      if (!mounted) return;
      batRef.current = bat;
      setSupported(true);
      const update = () =>
        setInfo({ level: Math.round(bat.level * 100), charging: bat.charging, chargingTime: bat.chargingTime });
      update();
      bat.addEventListener('levelchange', update);
      bat.addEventListener('chargingchange', update);
    });
    return () => {
      mounted = false;
    };
  }, [nav]);

  const chargingTest = () => {
    const bat = batRef.current;
    if (!bat) return;
    if (bat.charging) {
      setChargeDetected('yes');
      report('pass', 'Naka-charge na — port OK');
      return;
    }
    setChargeDetected('waiting');
    const onChange = () => {
      if (bat.charging) {
        setChargeDetected('yes');
        report('pass', 'Charging detected — port OK');
        bat.removeEventListener('chargingchange', onChange);
        window.clearTimeout(timer);
      }
    };
    bat.addEventListener('chargingchange', onChange);
    const timer = window.setTimeout(() => {
      bat.removeEventListener('chargingchange', onChange);
      setChargeDetected((s) => (s === 'yes' ? s : 'timeout'));
    }, 15000);
  };

  if (supported === false) {
    return (
      <div className="test-body">
        <PermissionError
          message="Walang Battery Status API (normal sa iOS)."
          hint="I-check sa Settings > Battery para sa health at charging."
        />
      </div>
    );
  }

  return (
    <div className="test-body">
      <p className="test-desc">
        Battery level, charging status, at charging port test. Isaksak ang cable — dapat
        ma-detect ang charging sa loob ng 15s.
      </p>
      {info && (
        <ul className="info-list">
          <li>
            <span>Level</span>
            <strong>{info.level}%</strong>
          </li>
          <li>
            <span>Charging</span>
            <strong style={{ color: info.charging ? '#12d6a0' : undefined }}>{info.charging ? 'Oo ⚡' : 'Hindi'}</strong>
          </li>
          {Number.isFinite(info.chargingTime) && info.chargingTime > 0 && (
            <li>
              <span>Time to full</span>
              <strong>{Math.round(info.chargingTime / 60)} min</strong>
            </li>
          )}
        </ul>
      )}
      <button className="btn btn-primary" onClick={chargingTest} disabled={chargeDetected === 'waiting'}>
        {chargeDetected === 'waiting' ? 'Naghihintay ng cable… (15s)' : '⚡ Charging port test'}
      </button>
      {chargeDetected === 'yes' && <div className="big-readout" style={{ color: '#12d6a0' }}>Charging ✅</div>}
      {chargeDetected === 'timeout' && (
        <div className="hint-text">Walang na-detect na charging. Check ang cable/port.</div>
      )}
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s, info ? `${info.level}%` : undefined)} />
      </div>
    </div>
  );
}

export function SimCarrierTest({ report }: TestProps) {
  return (
    <div className="test-body">
      <p className="test-desc">
        Hindi ma-access ng browser ang SIM/carrier info. Tsignal check + guided test call.
      </p>
      <ul className="check-list">
        <li>⬜ Tignan kung may signal bars sa status bar</li>
        <li>⬜ Tumawag sa test number para ma-verify ang SIM at signal</li>
      </ul>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s, 'Guided SIM/call test')} passLabel="May signal ✅" failLabel="Walang signal ❌" />
      </div>
    </div>
  );
}
