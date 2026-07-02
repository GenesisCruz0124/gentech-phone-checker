/** Luhn checksum validation, used for IMEI (15 digits). */
export function isValidLuhn(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export interface ImeiCheck {
  digits: string;
  lengthOk: boolean;
  luhnOk: boolean;
  valid: boolean;
}

export function checkImei(raw: string): ImeiCheck {
  const digits = raw.replace(/\D/g, '');
  const lengthOk = digits.length === 15;
  const luhnOk = isValidLuhn(digits);
  return { digits, lengthOk, luhnOk, valid: lengthOk && luhnOk };
}
