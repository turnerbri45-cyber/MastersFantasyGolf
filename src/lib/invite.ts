// Uses only unambiguous characters (no 0/O, 1/I, etc.)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8): string {
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += ALPHABET[byte % ALPHABET.length];
  }
  return result;
}
