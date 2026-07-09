import qrcode from 'qrcode-generator';

export interface QrMatrix {
  count: number;
  isDark: (row: number, col: number) => boolean;
}

/** Build a QR module matrix for `text` (error-correction level M). */
export function makeQr(text: string): QrMatrix {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  return { count, isDark: (r, c) => qr.isDark(r, c) };
}

/** The URL the QR should point at — wherever the app is currently hosted. */
export function appUrl(): string {
  if (typeof window === 'undefined') return 'https://genesiscruz0124.github.io/gentech-phone-checker/';
  const { origin, pathname } = window.location;
  // Strip any file segment, keep the app directory.
  const dir = pathname.replace(/[^/]*$/, '');
  return origin + dir;
}
