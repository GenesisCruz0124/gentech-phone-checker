import { useEffect, useRef, useState } from 'react';
import type { TestProps } from '../types';
import { PermissionError, ResultButtons, useMediaStream } from '../components/shared';

export function MicrophoneTest({ report }: TestProps) {
  const { stream, error, loading, start, stop } = useMediaStream();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [level, setLevel] = useState(0);
  const [recording, setRecording] = useState(false);
  const [hasPlayback, setHasPlayback] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!stream) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    audioCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const canvas = canvasRef.current!;
    const c = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    const draw = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.lineWidth = 2 * dpr;
      c.strokeStyle = '#12d6a0';
      c.beginPath();
      const slice = canvas.width / data.length;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128 - 1;
        sum += v * v;
        const y = (v * 0.5 + 0.5) * canvas.height;
        const x = i * slice;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3));
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.close().catch(() => {});
    };
  }, [stream]);

  const record = () => {
    if (!stream) return;
    try {
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (!audioElRef.current) audioElRef.current = new Audio();
        audioElRef.current.src = url;
        setHasPlayback(true);
        audioElRef.current.play().catch(() => {});
      };
      rec.start();
      setRecording(true);
      window.setTimeout(() => {
        rec.stop();
        setRecording(false);
      }, 3000);
    } catch {
      setRecording(false);
    }
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        Live waveform + level meter. May 3-second record & playback din para marinig mo
        ang sarili mo (test ng mic + speaker sabay). Manwal na pass/fail.
      </p>
      {!stream && !error && (
        <button className="btn btn-primary" onClick={() => start({ audio: true })} disabled={loading}>
          {loading ? 'Hinihingi ang permission…' : 'Buksan ang mic'}
        </button>
      )}
      {error && (
        <PermissionError
          message={error}
          onRetry={() => start({ audio: true })}
          hint="Kailangan ng mic permission para makita ang waveform."
        />
      )}
      {stream && (
        <>
          <canvas ref={canvasRef} className="waveform" />
          <div className="level-meter">
            <div className="level-fill" style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
          <div className="result-buttons">
            <button className="btn btn-primary" onClick={record} disabled={recording}>
              {recording ? 'Nagre-record… (3s)' : 'Record & playback (3s)'}
            </button>
            {hasPlayback && <button className="btn btn-ghost" onClick={() => audioElRef.current?.play()}>▶ Ulitin</button>}
          </div>
          <div className="result-row">
            <ResultButtons
              onResult={(s) => {
                stop();
                report(s);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

// --- Tone generator helpers ---
function useToneCtx() {
  const ref = useRef<AudioContext | null>(null);
  const get = () => {
    if (!ref.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ref.current = new AC();
    }
    if (ref.current.state === 'suspended') ref.current.resume();
    return ref.current;
  };
  useEffect(() => () => void ref.current?.close().catch(() => {}), []);
  return get;
}

function playTone(ctx: AudioContext, freq: number, durationMs: number, pan = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.value = 0.0001;
  let node: AudioNode = gain;
  if (typeof ctx.createStereoPanner === 'function' && pan !== 0) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner);
    node = panner;
  }
  osc.connect(gain);
  node.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.05);
}

export function LoudspeakerTest({ report }: TestProps) {
  const getCtx = useToneCtx();
  return (
    <div className="test-body">
      <p className="test-desc">
        Mga test tone: 440Hz (mid), 100Hz (low/bass), 8kHz (high/treble), at stereo L/R
        pan. Dapat malinaw, walang lagitik o crackle. Manwal na confirm.
      </p>
      <div className="tone-grid">
        <button className="btn btn-primary" onClick={() => playTone(getCtx(), 440, 1200)}>440 Hz</button>
        <button className="btn btn-primary" onClick={() => playTone(getCtx(), 100, 1200)}>100 Hz (low)</button>
        <button className="btn btn-primary" onClick={() => playTone(getCtx(), 8000, 1200)}>8 kHz (high)</button>
        <button className="btn btn-primary" onClick={() => playTone(getCtx(), 500, 1200, -1)}>◀ Left</button>
        <button className="btn btn-primary" onClick={() => playTone(getCtx(), 500, 1200, 1)}>Right ▶</button>
      </div>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s)} />
      </div>
    </div>
  );
}

export function HeadphoneTest({ report }: TestProps) {
  const getCtx = useToneCtx();
  const [outputs, setOutputs] = useState<number>(0);
  const [changed, setChanged] = useState(false);
  const baseline = useRef<number | null>(null);

  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.enumerateDevices) return;
    const update = async () => {
      try {
        const devs = await md.enumerateDevices();
        const n = devs.filter((d) => d.kind === 'audiooutput').length;
        if (baseline.current === null) baseline.current = n;
        else if (n !== baseline.current) setChanged(true);
        setOutputs(n);
      } catch {
        /* ignore */
      }
    };
    update();
    md.addEventListener?.('devicechange', update);
    return () => md.removeEventListener?.('devicechange', update);
  }, []);

  return (
    <div className="test-body">
      <p className="test-desc guided-badge">
        Guided/semi-auto. Isaksak ang wired headphones (o USB-C/3.5mm adapter), tapos i-play
        ang tono — dapat lumipat ang tunog sa headphones. Ide-detect din ng app kung nagbago
        ang audio outputs.
      </p>
      <button className="btn btn-primary" onClick={() => playTone(getCtx(), 440, 1500)}>
        ▶ Play tone (1.5s)
      </button>
      <div className="hint-text">
        Audio outputs detected: <strong>{outputs}</strong>
        {changed && <span style={{ color: '#12d6a0' }}> · nagbago (may nakasaksak) ✅</span>}
      </div>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s, changed ? 'Output change detected' : 'Guided headphone test')} passLabel="Gumagana ✅" failLabel="Sira ❌" />
      </div>
    </div>
  );
}

export function EarpieceTest({ report }: TestProps) {
  const getCtx = useToneCtx();
  return (
    <div className="test-body">
      <p className="test-desc guided-badge">
        Guided test. Hindi kayang piliin ng browser ang earpiece route. I-play ang tono
        tapos idikit ang phone sa tenga sa mababang volume — dapat naririnig sa earpiece.
      </p>
      <button className="btn btn-primary" onClick={() => playTone(getCtx(), 440, 2000)}>
        Play tone (2s)
      </button>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s, 'Guided earpiece test')} />
      </div>
    </div>
  );
}
