import { randomInt } from 'node:crypto';

/** Латиница A–Z и цифры 0–9; 36^6 комбинаций. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomQuotePublicCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[randomInt(0, 36)];
  }
  return s;
}

/** Параметр из URL: 6 символов латиницы/цифр — это публичный код (без учёта регистра). */
export function looksLikeQuotePublicCode(param: string): boolean {
  return /^[A-Za-z0-9]{6}$/.test(param.trim());
}
