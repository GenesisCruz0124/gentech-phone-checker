# Phase 2 — TODO (NOT built in Phase 1)

These are intentionally deferred. Leave as notes only until Phase 2 kicks off.

- [ ] **IMEI OCR via camera** — scan `*#06#` screen / box label with the camera
      instead of manual typing (e.g. Tesseract.js or the Shape Detection API).
- [ ] **PDF report export** — in addition to PNG + text, generate a shareable PDF
      of the report card.
- [x] **NFC test (Android)** — DONE (v1.0.1): Web NFC (`NDEFReader`) scan check,
      Android Chrome only, N/A elsewhere. Future: decode/display tag payload.
- [ ] **Result history** — keep past sessions in localStorage/IndexedDB with a
      picker, not just the last run.
- [ ] **QR code on report** — link to UnlockNa.ph / GenTech FB page from the
      report image.
- [ ] **Multi-language toggle** — English / Taglish switch (copy is currently
      Taglish-only).
