import { randomInt } from "node:crypto"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

export function randomQuotePublicCode(): string {
  let value = ""
  for (let i = 0; i < 6; i += 1) {
    value += ALPHABET[randomInt(0, 36)]
  }
  return value
}

export function looksLikeQuotePublicCode(param: string): boolean {
  return /^[A-Za-z0-9]{6}$/.test(param.trim())
}
