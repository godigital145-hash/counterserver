// Sans caractères ambigus (0/O, 1/I/L)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAIRING_TTL_MS = 30 * 60 * 1000;

export function genererPairingCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
}

export function pairingCodeExpiresAt(): string {
  return new Date(Date.now() + PAIRING_TTL_MS).toISOString();
}
