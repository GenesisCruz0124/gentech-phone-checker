# GenTech Phone Checker

Mobile-first, **100% client-side** phone hardware diagnostic web app by
**GenTech Repairs**. Runs entirely in the browser — no backend, no data leaves
the device. Built for Android Chrome and iOS Safari, sharable from a link.

> Browser-based diagnostic — may limitations vs native service tools. For full
> board-level diagnosis, visit GenTech Repairs.

## Stack

- **Vite + React + TypeScript** (strict mode)
- Hand-rolled CSS — mobile-first, dark theme, large touch targets
- React hooks only (no external state library)
- PWA basics: web manifest + icons (add-to-home-screen)

## App flow

1. **Landing** — branding + Start Diagnostic
2. **Device detection** — OS detect (with Android/iOS override), model best-guess,
   GPU/RAM/cores/refresh-rate, IMEI card (dial `*#06#` → manual entry + Luhn check)
3. **Test dashboard** — grid of test cards; run individually or **Run All** (guided).
   Unsupported tests are shown greyed with a reason (not hidden).
4. **Report card** — full results + device block + version/date, verdict line,
   Save-as-image / copy-for-Messenger export, localStorage persistence, New Test reset.

## Tests

Screen/LCD (dead pixel, burn-in, backlight bleed, gradient banding, brightness,
refresh rate) · Touchscreen (grid, multi-touch, line draw, ghost touch, edge,
latency) · Audio (mic + record/playback, loudspeaker tones, earpiece guided) ·
Cameras (front, back + multi-lens, torch — Android) · Sensors & Buttons
(vibration — Android, gyro/accel level, compass, GPS, volume/power guided,
fingerprint/Face ID via WebAuthn) · Connectivity & Power (online/connection,
speed test, Bluetooth — Android, battery + charging — Android, SIM guided).

Each test implements a common `TestModule` interface and reports
`pass | fail | skip | na`.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build to dist/
npm run preview    # preview the built app
```

## Deploy (Vercel via GitHub)

This project is Vercel-ready: standard Vite `dist/` output plus `vercel.json`
with an SPA rewrite fallback. **One-time setup:** the owner connects this repo
in the Vercel dashboard. After that, every push to the default branch
auto-deploys. (Do not use the `vercel` CLI from CI.)

## Releases

- App version lives in a single constant: [`src/version.ts`](src/version.ts),
  shown in the footer and report. Bump the patch on every release.
- Tag a release as `v<version>` (e.g. `v1.0.0`). The
  [`Release` workflow](.github/workflows/release.yml) builds, zips `dist/` as
  `GenTechPhoneChecker-v<version>.zip`, and attaches it to a GitHub Release.

## Privacy

Everything runs on-device. The GPS test reports **accuracy only** — the actual
coordinates are never read into state or stored. WebAuthn is used purely to
trigger the biometric prompt; no credential is persisted.

## Phase 2

See [`docs/PHASE2_TODO.md`](docs/PHASE2_TODO.md).
