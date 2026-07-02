# Claude Code Prompt — GenTech Phone Checker (Phase 1) — v2 for Claude Code Remote

Copy-paste everything below into your Claude Code Remote session (mobile app, repo already selected).

---

You are working inside the existing **gentech-phone-checker** GitHub repo via Claude Code Remote. Do NOT create a new repo. Build everything in this repo and push all changes to `main`.

Build a mobile-first, browser-based phone diagnostic web app called **GenTech Phone Checker**. It runs entirely client-side (no backend, no data leaves the device) and lets customers/technicians test phone hardware from a link. Target users are on Android Chrome and iOS Safari.

## Project Setup

- Stack: **Vite + React + TypeScript**. No UI framework — hand-rolled CSS (mobile-first, dark theme, large touch targets). No external state library; React hooks only.
- All work happens in this repo; commit in logical chunks and push to `main`.
- Deploy target: **Vercel via GitHub integration** — do NOT attempt `vercel` CLI login or deploy from this session. Just make the project Vercel-ready: standard Vite build output (`dist/`), and add `vercel.json` with an SPA rewrite fallback. The owner will connect this repo in the Vercel dashboard once; after that, every push to `main` auto-deploys.
- App version starts at `v1.0.0`, stored in a single `src/version.ts` constant and shown in the footer. Increment the patch version on every build/release. Tag releases as `v<version>` and create a GitHub Release per tag.
- Set up a **GitHub Actions workflow** that on every `v*` tag: installs deps, runs `npm run build`, zips the `dist/` folder as `GenTechPhoneChecker-v<version>.zip`, and attaches it to a GitHub Release.
- PWA basics: manifest + icons so it can be added to home screen. No service worker caching complexity in Phase 1 (just a minimal offline-capable shell if trivial).

## Claude Code Subagents (set these up first)

1. **verify-implementation** — after each feature is implemented and before any release/tag, this agent re-reads the requirements in this prompt, checks the implementation against them, runs the build, and reports pass/fail with specifics. Do not tag a release until it passes.
2. **allow-once-approver** — auto-approves "allow once" permission prompts during the session.

## App Flow

1. **Landing screen**: GenTech Repairs branding, app name, "Start Diagnostic" button.
2. **Device detection screen** (auto-runs):
   - Detect OS (Android/iOS/other) via User-Agent + UA Client Hints; let the user override with an Android/iOS toggle.
   - Display: detected brand/model guess, OS + version, browser, screen resolution + pixel ratio, GPU renderer via WebGL (`UNMASKED_RENDERER_WEBGL`), approximate RAM (`navigator.deviceMemory`, Android only), CPU cores (`hardwareConcurrency`), detected display refresh rate via `requestAnimationFrame` timing.
   - Model guessing: combine UA/Client Hints model string (Android exposes it), GPU renderer string, and screen metrics. On iOS the UA hides the model, so map GPU (e.g. "Apple A15 GPU") + logical resolution + devicePixelRatio to a best-guess model list (maintain a small lookup table for common iPhones, iPhone 7 through current). Always label it as "Detected (best guess)" — never claim certainty.
   - **IMEI**: browsers cannot read IMEI. Show a guided card: instruct the user to dial `*#06#`, then provide a manual input field to type/paste the IMEI so it appears on the final report. Validate with the Luhn checksum and show valid/invalid.
3. **Test dashboard**: grid of test cards, each with status (Not run / ✅ Pass / ❌ Fail / ⏭️ Skipped / 🚫 Not available on this OS). User can run tests in any order or tap "Run All" for a sequential guided flow. Tests that require permissions request them just-in-time with a friendly explainer.
4. **Report card** (final screen): see Report section.

## Tests to Implement

Each test is a self-contained component implementing a common `TestModule` interface: `{ id, title, supportedOn: 'all' | 'android' | 'ios', run/manual UI, result: pass|fail|skip|na, details?: string }`. If a capability is unavailable on the detected OS, show the card greyed out with a short reason instead of hiding it.

### Screen / LCD

- **Dead pixel test**: fullscreen solid colors — red, green, blue, white, black, 50% gray. Tap to cycle, long-press or small × to exit fullscreen. Use the Fullscreen API where available; on iOS Safari fall back to a full-viewport fixed overlay hiding all chrome as much as possible.
- **Burn-in / ghosting check**: checkerboard pattern + inverted checkerboard toggle, plus mid-gray full screen. Include a one-line tip: "Look for shadows of keyboard/status bar (common on AMOLED)."
- **Backlight bleed / uniformity**: full black screen with instruction to set brightness to max; user confirms pass/fail.
- **Gradient banding**: smooth horizontal gradients (black→white, and RGB gradients). Note in UI: banding can indicate low-quality replacement LCD.
- **Brightness response**: prompt user to slide brightness min→max while viewing a mid-gray screen; manual pass/fail.
- **Refresh rate detect**: measure via rAF over ~2 seconds, report Hz (e.g. 60/90/120). Include note: aftermarket panels often lock to 60Hz.

### Touchscreen

- **Grid test**: divide the full screen into a grid of cells (cell size ~40–48px, computed from viewport). User swipes to paint every cell; painted cells turn green. Untouched cells after user taps "Done" = potential dead zones, highlighted red on a results snapshot. Show percentage covered.
- **Multi-touch counter**: display live count of simultaneous touch points and the max reached; target ≥5.
- **Line drawing test**: canvas where user draws; render the raw touch path. Jitter/breaks indicate digitizer issues. Provide horizontal/diagonal guide lines to trace.
- **Ghost touch monitor**: 30-second countdown, user does not touch the screen. Any touch/pointer event logged with timestamp = fail, with an event log shown. Big visual result.
- **Edge touch test**: thin tap targets along all four edges and corners; all must register.
- **Touch latency feel test**: a dot follows the finger; user manually judges lag (pass/fail).

### Audio

- **Microphone**: `getUserMedia({audio})`, show a live waveform + level meter (Web Audio API). Include a 3-second record & playback loop so the user hears themselves (tests mic + speaker together). Manual pass/fail.
- **Loudspeaker**: play test tones — 440Hz, low 100Hz, high 8kHz — and a stereo L/R pan test. Manual confirm for each channel.
- **Earpiece test (guided)**: browsers can't force the earpiece route; instruct user to play the tone and hold phone to ear at low volume, manual pass/fail, labeled "guided test."

### Cameras

- **Front camera**: `getUserMedia({video: {facingMode: 'user'}})`, live preview, capture-a-frame button.
- **Back camera**: `facingMode: 'environment'`. Enumerate devices (`enumerateDevices`) and if multiple back lenses are exposed, list them for switching (Android often exposes wide/ultrawide).
- **Flashlight/torch** (Android Chrome only): after back camera stream starts, apply `ImageCapture`/track constraint `{torch: true}` toggle if supported; otherwise mark not available.
- Camera tests are manual pass/fail based on preview quality (focus, lines, dark spots).

### Sensors & Buttons

- **Vibration** (Android only): `navigator.vibrate` pattern test, manual confirm.
- **Gyroscope/Accelerometer**: DeviceMotion/DeviceOrientation with live 3D-ish bubble-level visualization. On iOS 13+, call `DeviceMotionEvent.requestPermission()` behind a button tap.
- **Compass**: heading readout where available.
- **GPS**: Geolocation API — show accuracy in meters and lock time; do not display or store the actual coordinates in the report, only "GPS: pass, accuracy Xm".
- **Volume buttons (guided)**: instruct user to press vol up/down while a video/audio element plays; detect volume-change side effects where possible, otherwise manual confirm. Label as guided.
- **Power button (guided)**: instruct user to press power to lock and unlock; app detects `visibilitychange` to confirm the screen turned off and came back. Semi-automatic.
- **Fingerprint / Face ID responder test**: use WebAuthn (`navigator.credentials.create` with platform authenticator, resident key discouraged) purely to trigger the biometric prompt. If the biometric prompt appears and completes, sensor responds = pass. Wrap in try/catch, clearly label: "Tests that the sensor responds — not a full diagnostic." Do not store any credential; use a throwaway challenge and discard results.

### Connectivity & Power

- **Online status + connection type**: `navigator.onLine`, `navigator.connection` (effectiveType, downlink) on Android.
- **Speed test**: download a small static asset (bundled ~1–5MB file or fetch from a public CDN with cache-busting) and measure Mbps; run 3 samples, show median. Label results as WiFi or cellular based on connection info when available, otherwise ask the user which they're on.
- **Bluetooth** (Android Chrome only): Web Bluetooth `requestDevice` scan behind a button; finding the chooser opens & lists devices = radio works. Mark N/A on iOS.
- **Battery** (Android Chrome only): Battery Status API — level %, charging boolean, charging time. **Charging test**: prompt user to plug in the cable and detect the `chargingchange` event within 15s = charging port pass. On iOS mark N/A with a note to check in Settings > Battery.
- **SIM/carrier**: not accessible in browsers — show an informational card with instructions to verify signal bars + a guided "make a test call" manual pass/fail.

## Report Card

- Summary screen listing every test with status and details, plus device info block (model guess, OS, IMEI if entered, screen res, refresh rate).
- Header: **GenTech Repairs** branding, app name, version, date/time of test.
- Footer CTA: "May sira ba? Message us: **m.me/genesiscruz0124**".
- Overall verdict line: X passed / Y failed / Z skipped.
- **Export**: (1) "Save as image" — render the report to a canvas/PNG via DOM-to-image approach and trigger download/share (`navigator.share` with file where supported); (2) plain-text copy button formatted for Messenger.
- Persist last results in `localStorage` so an accidental refresh doesn't wipe the session; add a "New Test" reset button.

## UX & Copy Rules

- All UI copy in **Taglish** — casual, friendly, techie tone (e.g. "I-swipe lahat ng boxes para ma-check ang dead zones"). Keep test names in English.
- Every OS-limited test must say why: e.g. "Hindi available sa iOS Safari — Apple restriction."
- Include a small disclaimer on landing + report: "Browser-based diagnostic — may limitations vs native service tools. For full board-level diagnosis, visit GenTech Repairs."
- Large buttons, high contrast, works one-handed. No horizontal scrolling. Test on 360px-wide viewport.

## Quality Gates

- TypeScript strict mode, no `any` leaks.
- Graceful permission-denied handling on every media/sensor test (show retry + instructions, never a blank screen).
- Run the **verify-implementation** agent against this spec before tagging `v1.0.0`.
- When done: push everything to `main`, tag `v1.0.0`, confirm the GitHub Release with the zipped build was created, and print the repo + release links. Remind the owner to connect the repo to Vercel in the dashboard (one-time) to get the live URL.

## Phase 2 (do NOT build now — leave TODO notes only)

- IMEI OCR via camera, PDF report export, NFC test (Android), result history, QR code on report linking to UnlockNa.ph / GenTech FB page, multi-language toggle (English/Taglish).
