import { useEffect, useRef, useState } from 'react';
import type { TestProps } from '../types';
import { PermissionError, ResultButtons, useMediaStream } from '../components/shared';

function CameraView({
  facing,
  report,
  allowTorch,
}: {
  facing: 'user' | 'environment';
  report: TestProps['report'];
  allowTorch: boolean;
}) {
  const { stream, error, loading, start, stop } = useMediaStream();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [lenses, setLenses] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

  const open = async (id?: string) => {
    const constraints: MediaStreamConstraints = {
      video: id ? { deviceId: { exact: id } } : { facingMode: facing },
    };
    const s = await start(constraints);
    if (s) {
      const track = s.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(allowTorch && !!caps.torch);
      // enumerate back lenses for environment camera (Android may expose several)
      if (facing === 'environment') {
        try {
          const devs = await navigator.mediaDevices.enumerateDevices();
          const cams = devs.filter((d) => d.kind === 'videoinput');
          if (cams.length > 1) setLenses(cams);
        } catch {
          /* ignore */
        }
      }
    }
  };

  // Attach the stream to the <video> only after it has mounted. Setting
  // srcObject right after getUserMedia resolves fails because the element
  // isn't in the DOM yet (stream state hasn't re-rendered), leaving a black
  // preview. Doing it in an effect keyed on `stream` fixes that.
  useEffect(() => {
    const v = videoRef.current;
    if (v && stream) {
      v.srcObject = stream;
      v.play().catch(() => {});
    }
  }, [stream]);

  useEffect(() => () => stop(), [stop]);

  const snap = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    setSnapshot(canvas.toDataURL('image/jpeg', 0.8));
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet] });
      setTorchOn((t) => !t);
    } catch {
      setTorchSupported(false);
    }
  };

  return (
    <div className="test-body">
      {!stream && !error && (
        <button className="btn btn-primary" onClick={() => open()} disabled={loading}>
          {loading ? 'Hinihingi ang permission…' : 'Buksan ang camera'}
        </button>
      )}
      {error && (
        <PermissionError
          message={error}
          onRetry={() => open(deviceId)}
          hint="Kailangan ng camera permission para sa preview."
        />
      )}
      {stream && (
        <>
          <video ref={videoRef} className="camera-preview" playsInline muted autoPlay />
          {lenses.length > 1 && (
            <select
              className="lens-select"
              value={deviceId ?? ''}
              onChange={(e) => {
                const id = e.target.value || undefined;
                setDeviceId(id);
                open(id);
              }}
            >
              <option value="">Default lens</option>
              {lenses.map((l, i) => (
                <option key={l.deviceId} value={l.deviceId}>
                  {l.label || `Lens ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          <div className="result-buttons">
            <button className="btn btn-primary" onClick={snap}>
              📸 Kunan ng frame
            </button>
            {torchSupported && (
              <button className="btn btn-ghost" onClick={toggleTorch}>
                🔦 Torch {torchOn ? 'OFF' : 'ON'}
              </button>
            )}
          </div>
          {snapshot && <img src={snapshot} className="camera-snap" alt="captured frame" />}
          <div className="result-row">
            <ResultButtons
              onResult={(s) => {
                stop();
                report(s);
              }}
              passLabel="Malinaw ✅"
              failLabel="May problema ❌"
            />
          </div>
        </>
      )}
    </div>
  );
}

export function FrontCameraTest({ report }: TestProps) {
  return (
    <>
      <p className="test-desc">
        Live preview ng front camera. Kunan ng frame at suriin ang focus, linya, o
        madilim na spots.
      </p>
      <CameraView facing="user" report={report} allowTorch={false} />
    </>
  );
}

export function BackCameraTest({ report }: TestProps) {
  return (
    <>
      <p className="test-desc">
        Live preview ng back camera. Kung maraming lens ang device (wide/ultrawide),
        makikita sa dropdown para lumipat. Suriin ang preview quality.
      </p>
      <CameraView facing="environment" report={report} allowTorch={false} />
    </>
  );
}

export function TorchTest({ report }: TestProps) {
  return (
    <>
      <p className="test-desc">
        Android Chrome lang. Buksan ang back camera, tapos i-toggle ang torch/flashlight.
        Kung hindi supported, mamamarkahang N/A.
      </p>
      <CameraView facing="environment" report={report} allowTorch />
    </>
  );
}
