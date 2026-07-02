import { useEffect, useRef, useState } from 'react';
import type { TestProps } from '../types';
import { Fullscreen, ResultButtons } from '../components/shared';
import { measureRefreshRate } from '../device/detect';

const COLORS: { name: string; css: string }[] = [
  { name: 'Red', css: '#ff0000' },
  { name: 'Green', css: '#00ff00' },
  { name: 'Blue', css: '#0000ff' },
  { name: 'White', css: '#ffffff' },
  { name: 'Black', css: '#000000' },
  { name: '50% Gray', css: '#808080' },
];

export function DeadPixelTest({ report }: TestProps) {
  const [fs, setFs] = useState(false);
  const [idx, setIdx] = useState(0);

  return (
    <div className="test-body">
      <p className="test-desc">
        I-fullscreen tapos i-tap para mag-cycle sa mga kulay (red, green, blue, white,
        black, gray). Hanapin ang mga tuldok na hindi tumutugma sa kulay — yun ang dead
        o stuck pixels.
      </p>
      <button className="btn btn-primary" onClick={() => setFs(true)}>
        Simulan (fullscreen)
      </button>
      <div className="result-row">
        <ResultButtons onResult={(s, d) => report(s, d)} />
      </div>

      <Fullscreen active={fs} onExit={() => setFs(false)}>
        <div
          className="solid-fill"
          style={{ background: COLORS[idx].css }}
          onClick={() => setIdx((i) => (i + 1) % COLORS.length)}
        >
          <span
            className="fill-label"
            style={{ color: COLORS[idx].name === 'White' ? '#000' : '#fff' }}
          >
            {COLORS[idx].name} · tap to cycle
          </span>
          <button
            className="fill-exit"
            onClick={(e) => {
              e.stopPropagation();
              setFs(false);
            }}
            aria-label="Exit"
          >
            ×
          </button>
        </div>
      </Fullscreen>
    </div>
  );
}

export function BurnInTest({ report }: TestProps) {
  const [fs, setFs] = useState(false);
  const [mode, setMode] = useState<0 | 1 | 2>(0); // checker, inverted, mid-gray

  const bg =
    mode === 2
      ? '#7f7f7f'
      : `repeating-conic-gradient(${
          mode === 0 ? '#000 0 25%, #fff 0 50%' : '#fff 0 25%, #000 0 50%'
        }) 0 0 / 40px 40px`;

  return (
    <div className="test-body">
      <p className="test-desc">
        Checkerboard + inverted + mid-gray. Tip: tingnan kung may multo/anino ng
        keyboard o status bar (common sa AMOLED burn-in).
      </p>
      <button className="btn btn-primary" onClick={() => setFs(true)}>
        Simulan (fullscreen)
      </button>
      <div className="result-row">
        <ResultButtons onResult={(s, d) => report(s, d)} />
      </div>

      <Fullscreen active={fs} onExit={() => setFs(false)}>
        <div className="solid-fill" style={{ background: bg }} onClick={() => setMode((m) => ((m + 1) % 3) as 0 | 1 | 2)}>
          <span className="fill-label" style={{ color: '#12d6a0', mixBlendMode: 'difference' }}>
            {['Checkerboard', 'Inverted', 'Mid-gray'][mode]} · tap to toggle
          </span>
          <button
            className="fill-exit"
            onClick={(e) => {
              e.stopPropagation();
              setFs(false);
            }}
            aria-label="Exit"
          >
            ×
          </button>
        </div>
      </Fullscreen>
    </div>
  );
}

export function BacklightTest({ report }: TestProps) {
  const [fs, setFs] = useState(false);
  return (
    <div className="test-body">
      <p className="test-desc">
        I-max ang brightness mo muna. Buong itim ang screen — tingnan kung may
        kumukupas na ilaw sa gilid o corners (backlight bleed) o hindi pantay na ilaw.
      </p>
      <button className="btn btn-primary" onClick={() => setFs(true)}>
        Buksan ang black screen
      </button>
      <div className="result-row">
        <ResultButtons onResult={(s, d) => report(s, d)} />
      </div>
      <Fullscreen active={fs} onExit={() => setFs(false)}>
        <div className="solid-fill" style={{ background: '#000' }}>
          <button className="fill-exit" onClick={() => setFs(false)} aria-label="Exit">
            ×
          </button>
        </div>
      </Fullscreen>
    </div>
  );
}

export function GradientTest({ report }: TestProps) {
  const [fs, setFs] = useState(false);
  const [g, setG] = useState(0);
  const grads = [
    'linear-gradient(90deg, #000, #fff)',
    'linear-gradient(90deg, #000, #ff0000)',
    'linear-gradient(90deg, #000, #00ff00)',
    'linear-gradient(90deg, #000, #0000ff)',
  ];
  return (
    <div className="test-body">
      <p className="test-desc">
        Smooth gradients. Kung may nakikita kang "banding" (mga hakbang-hakbang na
        linya sa halip na smooth), pwedeng senyales ng murang replacement LCD.
      </p>
      <button className="btn btn-primary" onClick={() => setFs(true)}>
        Simulan (fullscreen)
      </button>
      <div className="result-row">
        <ResultButtons onResult={(s, d) => report(s, d)} />
      </div>
      <Fullscreen active={fs} onExit={() => setFs(false)}>
        <div
          className="solid-fill"
          style={{ background: grads[g] }}
          onClick={() => setG((v) => (v + 1) % grads.length)}
        >
          <span className="fill-label" style={{ color: '#fff', mixBlendMode: 'difference' }}>
            tap to change gradient
          </span>
          <button
            className="fill-exit"
            onClick={(e) => {
              e.stopPropagation();
              setFs(false);
            }}
            aria-label="Exit"
          >
            ×
          </button>
        </div>
      </Fullscreen>
    </div>
  );
}

export function BrightnessTest({ report }: TestProps) {
  const [fs, setFs] = useState(false);
  return (
    <div className="test-body">
      <p className="test-desc">
        I-slide ang brightness mo mula min papuntang max habang nakatingin sa mid-gray
        screen. Dapat maayos ang paglipat ng liwanag, walang flicker o biglang pagdilim.
      </p>
      <button className="btn btn-primary" onClick={() => setFs(true)}>
        Buksan ang mid-gray
      </button>
      <div className="result-row">
        <ResultButtons onResult={(s, d) => report(s, d)} />
      </div>
      <Fullscreen active={fs} onExit={() => setFs(false)}>
        <div className="solid-fill" style={{ background: '#7f7f7f' }}>
          <button className="fill-exit" onClick={() => setFs(false)} aria-label="Exit">
            ×
          </button>
        </div>
      </Fullscreen>
    </div>
  );
}

export function RefreshRateTest({ report }: TestProps) {
  const [hz, setHz] = useState<number | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const done = useRef(false);

  const run = async () => {
    setMeasuring(true);
    const r = await measureRefreshRate(2000);
    setHz(r);
    setMeasuring(false);
    if (!done.current) done.current = true;
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="test-body">
      <p className="test-desc">
        Sinusukat ang refresh rate ng display gamit ang animation timing (~2s). Note:
        madalas naka-lock sa 60Hz ang aftermarket panels kahit 90/120Hz ang original.
      </p>
      <div className="big-readout">{measuring ? 'Sinusukat…' : hz ? `${hz} Hz` : 'N/A'}</div>
      <div className="result-buttons">
        <button className="btn btn-ghost" onClick={run} disabled={measuring}>
          Ulitin
        </button>
      </div>
      <div className="result-row">
        <ResultButtons
          onResult={(s) => report(s, hz ? `Measured ${hz} Hz` : undefined)}
          passLabel="Tama ✅"
          failLabel="Mali ❌"
        />
      </div>
    </div>
  );
}
