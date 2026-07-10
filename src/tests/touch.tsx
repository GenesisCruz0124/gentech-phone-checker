import { useEffect, useRef, useState } from 'react';
import type { TestProps } from '../types';
import { Fullscreen, ResultButtons } from '../components/shared';

export function GridTest({ report }: TestProps) {
  const [fs, setFs] = useState(false);
  const [dims, setDims] = useState({ cols: 0, rows: 0 });
  const paintedRef = useRef<Set<number>>(new Set());
  const [coverage, setCoverage] = useState(0);
  const [, force] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fs) return;
    const cell = 44;
    const cols = Math.max(1, Math.floor(window.innerWidth / cell));
    const rows = Math.max(1, Math.floor(window.innerHeight / cell));
    setDims({ cols, rows });
    paintedRef.current = new Set();
    setCoverage(0);
  }, [fs]);

  const paintAt = (clientX: number, clientY: number) => {
    const el = gridRef.current;
    if (!el || dims.cols === 0) return;
    const rect = el.getBoundingClientRect();
    const cw = rect.width / dims.cols;
    const ch = rect.height / dims.rows;
    const c = Math.floor((clientX - rect.left) / cw);
    const r = Math.floor((clientY - rect.top) / ch);
    if (c < 0 || r < 0 || c >= dims.cols || r >= dims.rows) return;
    const idx = r * dims.cols + c;
    if (!paintedRef.current.has(idx)) {
      paintedRef.current.add(idx);
      force((n) => n + 1);
    }
  };

  const finish = () => {
    const total = dims.cols * dims.rows;
    const cov = total ? Math.round((paintedRef.current.size / total) * 100) : 0;
    setCoverage(cov);
    setFs(false);
    report(cov >= 98 ? 'pass' : 'fail', `${cov}% ng screen na-cover`);
  };

  const total = dims.cols * dims.rows;
  const covNow = total ? Math.round((paintedRef.current.size / total) * 100) : 0;

  return (
    <div className="test-body">
      <p className="test-desc">
        I-swipe lahat ng boxes para ma-check ang dead zones. Ang mga hindi mo naabot =
        posibleng patay na bahagi ng touch. Pindutin ang "Tapos na" pag kumpleto.
      </p>
      <button className="btn btn-primary" onClick={() => setFs(true)}>
        Simulan (fullscreen)
      </button>
      {coverage > 0 && <div className="big-readout">{coverage}% covered</div>}
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s)} showSkip />
      </div>

      <Fullscreen active={fs} onExit={() => setFs(false)}>
        <div
          ref={gridRef}
          className="touch-grid"
          style={{
            gridTemplateColumns: `repeat(${dims.cols}, 1fr)`,
            gridTemplateRows: `repeat(${dims.rows}, 1fr)`,
            touchAction: 'none',
          }}
          onPointerDown={(e) => paintAt(e.clientX, e.clientY)}
          onPointerMove={(e) => {
            if (e.buttons || e.pointerType === 'touch') paintAt(e.clientX, e.clientY);
          }}
        >
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`grid-cell ${paintedRef.current.has(i) ? 'painted' : ''}`} />
          ))}
        </div>
        <div className="grid-hud">
          <span>{covNow}%</span>
          <button className="btn btn-primary btn-sm" onClick={finish}>
            Tapos na
          </button>
        </div>
      </Fullscreen>
    </div>
  );
}

export function MultiTouchTest({ report }: TestProps) {
  const [count, setCount] = useState(0);
  const [max, setMax] = useState(0);
  const active = useRef<Set<number>>(new Set());

  const update = () => {
    const c = active.current.size;
    setCount(c);
    setMax((m) => Math.max(m, c));
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        Ilagay ang lahat ng daliri sa pad sa baba. Target: ≥5 na sabay-sabay na touch
        points. Ipinapakita ang live count at ang pinakamataas na naabot.
      </p>
      <div className="multitouch-readout">
        <div>
          <div className="big-readout">{count}</div>
          <div className="readout-label">ngayon</div>
        </div>
        <div>
          <div className="big-readout" style={{ color: max >= 5 ? '#12d6a0' : undefined }}>
            {max}
          </div>
          <div className="readout-label">max</div>
        </div>
      </div>
      <div
        className="touch-pad"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          active.current.add(e.pointerId);
          update();
        }}
        onPointerUp={(e) => {
          active.current.delete(e.pointerId);
          update();
        }}
        onPointerCancel={(e) => {
          active.current.delete(e.pointerId);
          update();
        }}
        onPointerLeave={(e) => {
          active.current.delete(e.pointerId);
          update();
        }}
      >
        Pindutin dito gamit ang maraming daliri
      </div>
      <div className="result-row">
        <ResultButtons
          onResult={(s) => report(s, `Max ${max} points`)}
          passLabel={`Pass ✅ (${max}≥5)`}
        />
      </div>
    </div>
  );
}

export function LineDrawTest({ report }: TestProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const size = useRef({ w: 0, h: 0 });

  const drawGuides = (ctx: CanvasRenderingContext2D) => {
    const { w, h } = size.current;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    size.current = { w: rect.width, h: rect.height };
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    drawGuides(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Clear only the user's drawing — keep the guide/sample lines.
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    drawGuides(ctx);
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        I-trace ang mga guide line (pahiga at pahilis) gamit ang daliri. Kung may
        putol-putol o kabakol-bakol na linya, may problema ang digitizer.
      </p>
      <canvas
        ref={canvasRef}
        className="draw-canvas"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = canvasRef.current!.getContext('2d')!;
          const p = pos(e);
          ctx.strokeStyle = '#12d6a0';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext('2d')!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      />
      <div className="result-buttons">
        <button className="btn btn-ghost" onClick={clear}>
          Clear
        </button>
      </div>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s)} />
      </div>
    </div>
  );
}

export function GhostTouchTest({ report }: TestProps) {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(30);
  const [events, setEvents] = useState<string[]>([]);
  const timerRef = useRef<number | null>(null);

  const start = () => {
    setEvents([]);
    setLeft(30);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          window.clearInterval(timerRef.current!);
          setRunning(false);
          setEvents((ev) => {
            report(ev.length === 0 ? 'pass' : 'fail', ev.length === 0 ? 'Walang ghost touch' : `${ev.length} ghost event(s)`);
            return ev;
          });
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running, report]);

  const cancel = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRunning(false);
    setLeft(30);
  };

  const logTouch = (e: React.PointerEvent) => {
    if (!running) return;
    const ts = new Date().toLocaleTimeString();
    const x = Math.round(e.clientX);
    const y = Math.round(e.clientY);
    setEvents((ev) => [...ev, `Touch @ ${ts} (${x}, ${y})`]);
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        30-second test. HUWAG hawakan ang screen. Buong screen ang binabantayan — kung may
        ma-detect na touch kahit saan habang tumatakbo = ghost touch (fail). Ilalista ang
        bawat event na may timestamp at posisyon.
      </p>
      {!running && (
        <button className="btn btn-primary" onClick={start}>
          Simulan ang 30s test (fullscreen)
        </button>
      )}

      <Fullscreen active={running} onExit={cancel}>
        <div
          className={`ghost-full ${events.length ? 'ghost-bad' : 'ghost-good'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={logTouch}
        >
          <button
            className="fill-exit"
            onClick={(e) => {
              e.stopPropagation();
              cancel();
            }}
            aria-label="Itigil"
          >
            ×
          </button>
          <div className="ghost-count">{left}s</div>
          <div className="ghost-status">
            {events.length === 0 ? 'Malinis pa 👍 — huwag hawakan' : `⚠️ ${events.length} ghost touch!`}
          </div>
          <div className="ghost-hint">Buong screen ang sensitibo</div>
        </div>
      </Fullscreen>

      {!running && events.length > 0 && (
        <>
          <div className="big-readout" style={{ color: '#ff5c5c' }}>{events.length} ghost touch</div>
          <ul className="event-log">
            {events.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function EdgeTouchTest({ report }: TestProps) {
  const targets = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'] as const;
  const [hit, setHit] = useState<Set<string>>(new Set());
  const [fs, setFs] = useState(false);

  useEffect(() => {
    if (fs && hit.size === targets.length) {
      setFs(false);
      report('pass', 'Lahat ng edges/corners tumugon');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hit, fs]);

  const start = () => {
    setHit(new Set());
    setFs(true);
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        Fullscreen. Pindutin ang bawat target sa gilid at corners ng screen — lahat dapat
        mag-register. Kung may hindi tumutugon, may dead edge ang touch panel.
      </p>
      {!fs && (
        <button className="btn btn-primary" onClick={start}>
          Simulan (fullscreen)
        </button>
      )}

      <Fullscreen active={fs} onExit={() => setFs(false)}>
        <div className="edge-frame-full" style={{ touchAction: 'none' }}>
          {targets.map((t) => (
            <button
              key={t}
              className={`edge-target edge-${t} ${hit.has(t) ? 'edge-hit' : ''}`}
              onPointerDown={() => setHit((s) => new Set(s).add(t))}
              aria-label={`edge ${t}`}
            />
          ))}
          <button
            className="edge-exit"
            onClick={(e) => {
              e.stopPropagation();
              setFs(false);
            }}
            aria-label="Itigil"
          >
            ×
          </button>
          <div className="edge-center">
            {hit.size}/{targets.length}
          </div>
        </div>
      </Fullscreen>

      <div className="result-row">
        <ResultButtons onResult={(s) => report(s)} passLabel="Pass ✅" />
      </div>
    </div>
  );
}

export function LatencyTest({ report }: TestProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent) => {
    const rect = areaRef.current!.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="test-body">
      <p className="test-desc">
        Igalaw ang daliri — susundan ka ng tuldok. Pakiramdam kung may lag o delay.
        Manwal na pass/fail base sa pagka-responsive.
      </p>
      <div
        ref={areaRef}
        className="latency-area"
        style={{ touchAction: 'none' }}
        onPointerMove={move}
        onPointerDown={move}
      >
        {pos && <div className="latency-dot" style={{ left: pos.x, top: pos.y }} />}
        {!pos && <span className="hint-text">Igalaw ang daliri dito</span>}
      </div>
      <div className="result-row">
        <ResultButtons onResult={(s) => report(s)} passLabel="Mabilis ✅" failLabel="May lag ❌" />
      </div>
    </div>
  );
}
