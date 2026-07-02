import { useEffect, useRef, useState } from 'react';
import type { TestProps } from '../types';
import { PermissionError, ResultButtons } from '../components/shared';

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function VibrationTest({ report }: TestProps) {
  const supported = typeof navigator.vibrate === 'function';
  const [buzzed, setBuzzed] = useState(false);
  const [maybeBlocked, setMaybeBlocked] = useState(false);
  const buzz = () => {
    if (!supported) return;
    // Some engines return false when the OS blocks/ignores the request.
    const ok = navigator.vibrate([300, 120, 300, 120, 500]);
    setBuzzed(true);
    setMaybeBlocked(ok === false);
  };
  return (
    <div className="test-body">
      <p className="test-desc">
        Android lang. I-play ang vibration pattern — dapat ramdam mo ang pag-vibrate ng
        phone. Manwal na confirm.
      </p>
      {!supported ? (
        <PermissionError message="Hindi suportado ang Vibration API sa device/browser na ito." />
      ) : (
        <>
          <button className="btn btn-primary" onClick={buzz}>
            📳 Vibrate
          </button>
          {buzzed && (
            <p className="hint-text">
              Walang ramdam? Karaniwang dahilan: naka-<strong>Silent/DND</strong>, naka-off
              ang <strong>haptics / vibrate-on-touch</strong> sa Settings, o hina-block ng
              ilang phone (lalo <strong>MIUI/Xiaomi</strong>) ang web vibration. Try mo sa
              Settings → Sounds &amp; vibration, tapos ulitin.
            </p>
          )}
          {maybeBlocked && (
            <p className="hint-text" style={{ color: '#e0b34d' }}>
              ⚠️ Ni-report ng browser na na-block ang request — device/OS restriction, hindi
              app bug.
            </p>
          )}
          <div className="result-row">
            <ResultButtons onResult={(s) => report(s)} passLabel="Ramdam ✅" failLabel="Walang vibrate ❌" />
          </div>
        </>
      )}
    </div>
  );
}

export function GyroTest({ report, os }: TestProps) {
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);
  const [needPerm, setNeedPerm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handler = useRef((e: DeviceOrientationEvent) => {
    const gamma = e.gamma ?? 0; // left-right [-90,90]
    const beta = e.beta ?? 0; // front-back [-180,180]
    setTilt({ x: Math.max(-45, Math.min(45, gamma)), y: Math.max(-45, Math.min(45, beta)) });
  });

  const begin = async () => {
    setErr(null);
    const DOE = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic | undefined;
    if (os === 'ios' && DOE?.requestPermission) {
      try {
        const res = await DOE.requestPermission();
        if (res !== 'granted') {
          setErr('Na-deny ang motion permission. I-allow para gumana ang level.');
          return;
        }
      } catch {
        setErr('Hindi ma-request ang motion permission.');
        return;
      }
    }
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setErr('Walang orientation sensor na na-detect.');
      return;
    }
    window.addEventListener('deviceorientation', handler.current);
    setRunning(true);
  };

  useEffect(() => {
    const DOE = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic | undefined;
    if (os === 'ios' && DOE?.requestPermission) setNeedPerm(true);
    const h = handler.current;
    return () => window.removeEventListener('deviceorientation', h);
  }, [os]);

  return (
    <div className="test-body">
      <p className="test-desc">
        Bubble level gamit ang gyroscope/accelerometer. Ikiling ang phone — dapat gumalaw
        ang bubble. {needPerm && 'Sa iOS, kailangan mo munang i-allow ang motion access.'}
      </p>
      {!running && !err && (
        <button className="btn btn-primary" onClick={begin}>
          {needPerm ? 'I-allow ang motion & simulan' : 'Simulan'}
        </button>
      )}
      {err && <PermissionError message={err} onRetry={begin} />}
      {running && (
        <div className="level-box">
          <div className="level-crosshair" />
          <div
            className="level-bubble"
            style={{
              transform: `translate(${(tilt?.x ?? 0) * 2}px, ${(tilt?.y ?? 0) * 2}px)`,
            }}
          />
        </div>
      )}
      {running && (
        <div className="result-row">
          <ResultButtons onResult={(s) => report(s, tilt ? 'Nag-react ang sensor' : undefined)} passLabel="Gumagana ✅" failLabel="Walang galaw ❌" />
        </div>
      )}
    </div>
  );
}

export function CompassTest({ report, os }: TestProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handler = useRef((e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
    const h = e.webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null);
    if (h != null) setHeading(Math.round(h));
  });

  const begin = async () => {
    setErr(null);
    const DOE = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic | undefined;
    if (os === 'ios' && DOE?.requestPermission) {
      try {
        const res = await DOE.requestPermission();
        if (res !== 'granted') {
          setErr('Na-deny ang compass/motion permission.');
          return;
        }
      } catch {
        setErr('Hindi ma-request ang permission.');
        return;
      }
    }
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setErr('Walang compass sensor na na-detect.');
      return;
    }
    window.addEventListener('deviceorientationabsolute', handler.current as EventListener);
    window.addEventListener('deviceorientation', handler.current as EventListener);
    setRunning(true);
  };

  useEffect(() => {
    const h = handler.current as EventListener;
    return () => {
      window.removeEventListener('deviceorientationabsolute', h);
      window.removeEventListener('deviceorientation', h);
    };
  }, []);

  return (
    <div className="test-body">
      <p className="test-desc">
        Heading readout ng compass (kung available). Iikot ang phone — dapat magbago ang
        degrees.
      </p>
      {!running && !err && (
        <button className="btn btn-primary" onClick={begin}>
          Simulan
        </button>
      )}
      {err && <PermissionError message={err} onRetry={begin} />}
      {running && (
        <>
          <div className="compass-dial" style={{ transform: `rotate(${-(heading ?? 0)}deg)` }}>
            <span className="compass-n">N</span>
          </div>
          <div className="big-readout">{heading != null ? `${heading}°` : '—'}</div>
          <div className="result-row">
            <ResultButtons onResult={(s) => report(s, heading != null ? `${heading}°` : undefined)} passLabel="Gumagana ✅" failLabel="Walang basa ❌" />
          </div>
        </>
      )}
    </div>
  );
}

export function GpsTest({ report }: TestProps) {
  const [status, setStatus] = useState<'idle' | 'locating' | 'done' | 'error'>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lockMs, setLockMs] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const begin = () => {
    if (!navigator.geolocation) {
      setErr('Walang Geolocation API sa browser na ito.');
      setStatus('error');
      return;
    }
    setStatus('locating');
    setErr(null);
    const t0 = performance.now();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Privacy: we never read or store the actual coordinates — accuracy only.
        setAccuracy(Math.round(pos.coords.accuracy));
        setLockMs(Math.round(performance.now() - t0));
        setStatus('done');
        report('pass', `accuracy ${Math.round(pos.coords.accuracy)}m`);
      },
      (e) => {
        setErr(
          e.code === e.PERMISSION_DENIED
            ? 'Na-block ang location permission. I-allow para gumana ang GPS test.'
            : 'Hindi makakuha ng GPS lock. Subukan sa labas o malinaw na lugar.',
        );
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        Kinukuha ang GPS accuracy at lock time. <strong>Hindi</strong> nire-record ang
        totoong coordinates mo — accuracy lang ang ipapakita sa report.
      </p>
      {status === 'idle' && (
        <button className="btn btn-primary" onClick={begin}>
          Kumuha ng GPS lock
        </button>
      )}
      {status === 'locating' && <div className="big-readout">Naghahanap ng lock…</div>}
      {status === 'error' && err && <PermissionError message={err} onRetry={begin} />}
      {status === 'done' && (
        <div className="gps-result">
          <div className="big-readout" style={{ color: '#12d6a0' }}>±{accuracy}m</div>
          <div className="readout-label">Lock time: {lockMs}ms</div>
          <div className="result-row">
            <ResultButtons onResult={(s) => report(s, `accuracy ${accuracy}m`)} showSkip={false} />
          </div>
        </div>
      )}
    </div>
  );
}

export function VolumeButtonTest({ report }: TestProps) {
  return (
    <div className="test-body">
      <p className="test-desc guided-badge">
        Guided test. Habang naka-play ang audio sa baba, pindutin ang volume up/down.
        Dapat magbago ang lakas ng tunog. (Hindi laging nade-detect ng browser ang
        volume keys, kaya manwal na confirm.)
      </p>
      <audio controls className="full-width-audio" src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YQAAAAA=">
        Audio element
      </audio>
      <p className="hint-text">Wala kang maririnig? I-play muna ang sarili mong music/video app.</p>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s, 'Guided volume test')} passLabel="Gumagana ✅" failLabel="Sira ❌" />
      </div>
    </div>
  );
}

export function PowerButtonTest({ report }: TestProps) {
  const [locked, setLocked] = useState(false);
  const [returned, setReturned] = useState(false);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') setLocked(true);
      else if (document.visibilityState === 'visible' && locked) setReturned(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [locked]);

  useEffect(() => {
    if (returned) report('pass', 'Screen off/on detected via visibilitychange');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returned]);

  return (
    <div className="test-body">
      <p className="test-desc guided-badge">
        Semi-automatic. Pindutin ang power button para i-lock ang screen, tapos i-unlock.
        Ide-detect ng app kung talagang nag-off at bumalik ang screen.
      </p>
      <ul className="check-list">
        <li className={locked ? 'ok' : ''}>{locked ? '✅' : '⬜'} Na-lock ang screen</li>
        <li className={returned ? 'ok' : ''}>{returned ? '✅' : '⬜'} Bumalik / na-unlock</li>
      </ul>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s)} passLabel="Gumagana ✅" failLabel="Sira ❌" />
      </div>
    </div>
  );
}

export function ProximityTest({ report }: TestProps) {
  const [near, setNear] = useState<boolean | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // Legacy proximity events are Firefox-only; most Chrome builds don't expose
    // a web proximity sensor. Attempt it, otherwise fall back to a guided test.
    const w = window as unknown as {
      ondeviceproximity?: unknown;
      onuserproximity?: unknown;
    };
    if ('ondeviceproximity' in w) {
      const h = (e: Event & { value?: number; min?: number; max?: number }) => {
        setLive(true);
        const v = e.value ?? 0;
        const max = e.max ?? 5;
        setNear(v < max / 2);
      };
      window.addEventListener('deviceproximity', h as EventListener);
      return () => window.removeEventListener('deviceproximity', h as EventListener);
    }
    if ('onuserproximity' in w) {
      const h = (e: Event & { near?: boolean }) => {
        setLive(true);
        setNear(!!e.near);
      };
      window.addEventListener('userproximity', h as EventListener);
      return () => window.removeEventListener('userproximity', h as EventListener);
    }
    return undefined;
  }, []);

  return (
    <div className="test-body">
      <p className="test-desc guided-badge">
        Karamihan ng browser (kasama Chrome) ay hindi nagbibigay ng direktang access sa
        proximity sensor, kaya guided ito. Takpan ang taas ng screen malapit sa earpiece —
        sa totoong tawag, dapat mag-off ang screen. Kumpirmahin kung gumagana.
      </p>
      {live && (
        <div className="big-readout" style={{ color: near ? '#12d6a0' : undefined }}>
          {near ? 'MALAPIT' : 'MALAYO'}
        </div>
      )}
      {!live && <p className="hint-text">Walang live sensor reading dito — manwal na check.</p>}
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s, live ? 'Sensor reading available' : 'Guided proximity')} passLabel="Gumagana ✅" failLabel="Sira ❌" />
      </div>
    </div>
  );
}

export function BiometricTest({ report }: TestProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'pass' | 'fail'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    setStatus('running');
    setMsg(null);
    try {
      if (!window.PublicKeyCredential || !navigator.credentials?.create) {
        throw new Error('WebAuthn hindi supported dito.');
      }
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);
      // Throwaway credential purely to trigger the biometric prompt.
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'GenTech Phone Checker' },
          user: { id: userId, name: 'gentech-test', displayName: 'GenTech Test' },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'discouraged',
          },
          timeout: 30000,
        },
      });
      // Discard immediately — we store nothing.
      void cred;
      setStatus('pass');
      report('pass', 'Biometric prompt responded');
    } catch (e) {
      const name = (e as { name?: string }).name ?? '';
      if (name === 'NotAllowedError') {
        setMsg('Na-cancel o hindi natapos ang biometric prompt.');
      } else {
        setMsg((e as Error).message || 'Hindi tumugon ang sensor.');
      }
      setStatus('fail');
    }
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        Fingerprint / Face ID responder test gamit ang WebAuthn. Kung lumabas at natapos
        ang biometric prompt = tumutugon ang sensor.
        <br />
        <em>Sinusubok lang kung tumutugon ang sensor — hindi ito full diagnostic. Walang
        ini-store na credential.</em>
      </p>
      {status !== 'pass' && (
        <button className="btn btn-primary" onClick={run} disabled={status === 'running'}>
          {status === 'running' ? 'Naghihintay ng prompt…' : 'Trigger biometric prompt'}
        </button>
      )}
      {status === 'pass' && <div className="big-readout" style={{ color: '#12d6a0' }}>Tumugon ✅</div>}
      {status === 'fail' && msg && <PermissionError message={msg} onRetry={run} />}
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s)} passLabel="Tumugon ✅" failLabel="Walang tugon ❌" />
      </div>
    </div>
  );
}
